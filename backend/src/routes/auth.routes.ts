import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const isValidPassword = await bcrypt.compare(password, user.senha)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = jwt.sign(
      { id: user.id, perfil: user.perfil },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        perfil: user.perfil
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

export default router
