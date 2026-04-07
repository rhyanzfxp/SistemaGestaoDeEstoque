import { Router } from 'express'
import { mockDatabase } from '../config/mockDataBase'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const produtos = mockDatabase.produtos.filter(p => p.ativo)

    const totalProdutos = produtos.length
    const totalItensEstoque = produtos.reduce((sum, p) => sum + p.quantidade_atual, 0)
    const produtosEstoqueMinimo = produtos.filter(p => p.quantidade_atual <= p.estoque_minimo).length
    const produtosProximoVencimento = 0

    const movimentacoes = mockDatabase.movimentacoes
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    const ultimasMovimentacoes = movimentacoes.map(m => {
      const usuario = mockDatabase.usuarios.find(u => u.id === m.usuario_id)
      
      return {
        id: m.id,
        tipo: m.tipo,
        produto: m.produto_nome,
        quantidade: m.quantidade,
        usuario: usuario?.nome || '',
        data: m.created_at
      }
    })

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
