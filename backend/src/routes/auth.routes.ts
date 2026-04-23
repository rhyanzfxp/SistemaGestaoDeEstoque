import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase'
import { gerarToken, hashToken, calcularExpiracao } from '../utils/token.utils'
import { enviarEmailRecuperacao } from '../services/email.service'

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

router.post('/recuperar-senha', async (req, res) => {
  const MENSAGEM_GENERICA = 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.'

  try {
    const { email } = req.body

    // Busca usuário ativo pelo e-mail
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', email)
      .eq('ativo', true)
      .single()

    // Se não encontrado, retorna 200 genérico sem revelar existência (req. 1.5)
    if (!usuario) {
      return res.status(200).json({ mensagem: MENSAGEM_GENERICA })
    }

    // Gera token, hash e expiração (req. 1.2, 1.3)
    const token = gerarToken()
    const hash = hashToken(token)
    const expiraEm = calcularExpiracao()

    // Invalida tokens anteriores do usuário (req. 1.6)
    await supabase
      .from('tokens_recuperacao_senha')
      .update({ usado: true })
      .eq('usuario_id', usuario.id)
      .eq('usado', false)

    // Insere novo token no banco (req. 1.3)
    await supabase
      .from('tokens_recuperacao_senha')
      .insert({
        usuario_id: usuario.id,
        hash_token: hash,
        usado: false,
        expira_em: expiraEm.toISOString()
      })

    // Monta link e envia e-mail (req. 1.4, 2.1, 2.2)
    const link = `${process.env.FRONTEND_URL}/recuperar-senha?token=${token}`

    try {
      await enviarEmailRecuperacao(usuario.email, link)
      console.log(`E-mail de recuperação enviado para usuário ${usuario.id}`) // req. 2.4 — sem expor token
    } catch (emailError) {
      console.error('Falha ao enviar e-mail de recuperação:', emailError) // req. 2.5
      return res.status(500).json({ erro: 'Erro ao enviar e-mail. Tente novamente mais tarde.' })
    }

    return res.status(200).json({ mensagem: MENSAGEM_GENERICA })
  } catch (error) {
    console.error('Erro interno em /recuperar-senha:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor.' })
  }
})

router.get('/validar-token', async (req, res) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ erro: 'Token expirado ou inválido' })
    }

    const hash = hashToken(token)

    const { data: registro } = await supabase
      .from('tokens_recuperacao_senha')
      .select('id')
      .eq('hash_token', hash)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single()

    if (!registro) {
      return res.status(400).json({ erro: 'Token expirado ou inválido' })
    }

    return res.status(200).json({ valido: true })
  } catch (error) {
    console.error('Erro interno em /validar-token:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor.' })
  }
})

router.post('/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body

    // Valida comprimento mínimo da senha (req. 4.7)
    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' })
    }

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ erro: 'Token expirado ou inválido' })
    }

    const hash = hashToken(token)

    // Busca token válido: não usado e não expirado (req. 4.4, 3.2, 3.3, 3.5)
    const { data: registro } = await supabase
      .from('tokens_recuperacao_senha')
      .select('id, usuario_id')
      .eq('hash_token', hash)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single()

    if (!registro) {
      return res.status(400).json({ erro: 'Token expirado ou inválido' })
    }

    // Gera hash bcrypt da nova senha (req. 4.5, 5.1)
    const hashSenha = await bcrypt.hash(novaSenha, 10)

    // Atualiza senha do usuário (req. 4.5, 5.1, 5.2 — updated_at via trigger)
    await supabase
      .from('usuarios')
      .update({ senha: hashSenha })
      .eq('id', registro.usuario_id)

    // Marca token como usado (req. 4.6, 3.4)
    await supabase
      .from('tokens_recuperacao_senha')
      .update({ usado: true })
      .eq('id', registro.id)

    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso' })
  } catch (error) {
    console.error('Erro interno em /redefinir-senha:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor.' })
  }
})

export default router
