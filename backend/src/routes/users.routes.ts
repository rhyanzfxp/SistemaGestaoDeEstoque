import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { mockDatabase } from '../config/mockDataBase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authMiddleware, requireRole('ADMIN'), (req: Request, res: Response) => {
  try {
    const users = mockDatabase.usuarios.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      ativo: u.ativo,
      created_at: u.created_at || new Date().toISOString()
    }))
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

    const userExists = mockDatabase.usuarios.some(u => u.email === email)
    if (userExists) {
      return res.status(400).json({ error: 'Email já está em uso' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
      id: randomUUID(),
      nome,
      email,
      senha: hashedPassword,
      perfil: perfil as 'ADMIN' | 'GESTAO',
      ativo: true,
      created_at: new Date().toISOString()
    }

    mockDatabase.usuarios.push(newUser)

    res.status(201).json({
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.email,
      perfil: newUser.perfil,
      ativo: newUser.ativo,
      created_at: newUser.created_at
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { nome, email, perfil, ativo } = req.body

    const user = mockDatabase.usuarios.find(u => u.id === id)
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    if (email && email !== user.email) {
      const emailExists = mockDatabase.usuarios.some(u => u.email === email && u.id !== id)
      if (emailExists) {
        return res.status(400).json({ error: 'Email já está em uso' })
      }
      user.email = email
    }

    if (nome) user.nome = nome
    if (perfil) {
      if (!['ADMIN', 'GESTAO'].includes(perfil)) {
        return res.status(400).json({ error: 'Perfil inválido' })
      }
      user.perfil = perfil as 'ADMIN' | 'GESTAO'
    }
    if (ativo !== undefined) user.ativo = ativo

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      created_at: user.created_at
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
})

router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const userIndex = mockDatabase.usuarios.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const deletedUser = mockDatabase.usuarios.splice(userIndex, 1)[0]

    res.json({
      message: 'Usuário deletado com sucesso',
      user: {
        id: deletedUser.id,
        nome: deletedUser.nome,
        email: deletedUser.email
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' })
  }
})

export default router
