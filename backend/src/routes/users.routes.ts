import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'
import { getIO } from '../utils/socket'

const router = Router()

// Upload de avatar do próprio usuário
router.post('/me/avatar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const contentType = req.headers['content-type'] || 'image/jpeg'

    // Valida tipo de arquivo
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.' })
    }

    const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
    const filePath = `${userId}/avatar.${ext}`

    // Faz upload direto do body (buffer) para o Supabase Storage
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    const fileBuffer = Buffer.concat(chunks)

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Arquivo vazio' })
    }

    if (fileBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5 MB.' })
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      })

    if (uploadError) throw uploadError

    // Gera URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Salva URL no banco
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (updateError) throw updateError

    res.json({ avatar_url: avatarUrl })
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error)
    res.status(500).json({ error: 'Erro ao fazer upload do avatar' })
  }
})

// Remove avatar do próprio usuário
router.delete('/me/avatar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id

    // Tenta remover arquivos com extensões possíveis
    const extensions = ['jpg', 'png', 'webp', 'gif']
    for (const ext of extensions) {
      await supabase.storage.from('avatars').remove([`${userId}/avatar.${ext}`])
    }

    await supabase
      .from('usuarios')
      .update({ avatar_url: null })
      .eq('id', userId)

    res.json({ message: 'Avatar removido com sucesso' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover avatar' })
  }
})

router.get('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, ativo, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' })
  }
})

router.post('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { nome, email, password, perfil } = req.body

    if (!nome || !email || !password || !perfil) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    if (!['ADMIN', 'GESTAO'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido' })
    }

    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert({
        nome,
        email,
        senha: hashedPassword,
        perfil,
        ativo: true
      })
      .select('id, nome, email, perfil, ativo, created_at')
      .single()

    if (error) throw error

    getIO().emit('estoque_atualizado')

    res.status(201).json(newUser)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { nome, email, perfil, ativo } = req.body

    if (perfil && !['ADMIN', 'GESTAO'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido' })
    }

    if (email) {
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single()

      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' })
      }
    }

    const updateData: any = {}
    if (nome) updateData.nome = nome
    if (email) updateData.email = email
    if (perfil) updateData.perfil = perfil
    if (ativo !== undefined) updateData.ativo = ativo

    const { data: updatedUser, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select('id, nome, email, perfil, ativo, created_at')
      .single()

    if (error) throw error
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    getIO().emit('estoque_atualizado')

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
})

router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: deletedUser, error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select('id, nome, email')
      .single()

    if (error) throw error
    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    getIO().emit('estoque_atualizado')

    res.json({
      message: 'Usuário deletado com sucesso',
      user: deletedUser
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' })
  }
})

export default router
