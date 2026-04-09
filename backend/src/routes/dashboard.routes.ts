import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)

    if (produtosError) throw produtosError

    const totalProdutos = produtos?.length || 0
    const totalItensEstoque = produtos?.reduce((sum, p) => sum + p.quantidade_atual, 0) || 0
    const produtosEstoqueMinimo = produtos?.filter(p => p.quantidade_atual <= p.estoque_minimo).length || 0
    const produtosProximoVencimento = 0

    const { data: movimentacoes, error: movError } = await supabase
      .from('movimentacoes')
      .select(`
        id,
        tipo,
        produto_nome,
        quantidade,
        created_at,
        usuarios:usuario_id (nome)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (movError) throw movError

    const ultimasMovimentacoes = movimentacoes?.map(m => ({
      id: m.id,
      tipo: m.tipo,
      produto: m.produto_nome,
      quantidade: m.quantidade,
      usuario: (m.usuarios as any)?.nome || '',
      data: m.created_at
    })) || []

    res.json({
      totalProdutos,
      totalItensEstoque,
      produtosEstoqueMinimo,
      produtosProximoVencimento,
      ultimasMovimentacoes
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dashboard' })
  }
})

export default router
