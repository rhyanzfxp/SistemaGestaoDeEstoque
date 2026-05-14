import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()


router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('relatorios')
      .select('*, usuarios:gerado_por (nome)')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error)
    res.status(500).json({ error: 'Erro ao buscar relatórios' })
  }
})


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipo, titulo, parametros, dados } = req.body
    const usuario_id = (req as any).user?.id

    const { data, error } = await supabase
      .from('relatorios')
      .insert([{ tipo, titulo, parametros, dados, gerado_por: usuario_id }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Erro ao salvar relatório:', error)
    res.status(500).json({ error: 'Erro ao salvar relatório' })
  }
})


router.get('/estoque', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categorias:categoria_id(nome),
        fornecedores:fornecedor_id(nome)
      `)
      .order('nome')

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error)
    res.status(500).json({ error: 'Erro ao gerar relatório de estoque' })
  }
})


router.get('/movimentacoes', authMiddleware, async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo } = req.query
    
    let query = supabase
      .from('movimentacoes')
      .select(`
        *,
        usuarios:usuario_id(nome),
        fornecedores:fornecedor_id(nome)
      `)
      .order('created_at', { ascending: false })

    if (dataInicio) query = query.gte('created_at', dataInicio + 'T00:00:00.000Z')
    if (dataFim) query = query.lte('created_at', dataFim + 'T23:59:59.999Z')
    if (tipo) query = query.eq('tipo', tipo)

    const { data, error } = await query

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Erro ao gerar relatório de movimentações:', error)
    res.status(500).json({ error: 'Erro ao gerar relatório de movimentações' })
  }
})


router.get('/vencimentos', authMiddleware, async (req, res) => {
  try {
    const { dias = 30 } = req.query
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const dataLimite = new Date(hoje)
    dataLimite.setDate(hoje.getDate() + Number(dias))

    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categorias:categoria_id(nome)
      `)
      .not('data_validade', 'is', null)
      .gte('data_validade', hoje.toISOString())
      .lte('data_validade', dataLimite.toISOString())
      .order('data_validade', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Erro ao gerar relatório de vencimentos:', error)
    res.status(500).json({ error: 'Erro ao gerar relatório de vencimentos' })
  }
})

export default router
