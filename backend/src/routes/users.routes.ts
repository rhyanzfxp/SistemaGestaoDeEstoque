import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

const router = Router()

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

    res.json({
      message: 'Usuário deletado com sucesso',
      user: deletedUser
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' })
  }
})

export default router
