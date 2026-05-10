import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// --- Helpers para movimentações por categoria ---

const PERIODOS: Record<string, number> = {
  semana: 7,
  mes: 30,
  ano: 365
}

function calcularDataInicio(periodo: string): Date {
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - PERIODOS[periodo])
  return dataInicio
}

function validarPeriodo(periodo: unknown): periodo is string {
  return periodo === 'semana' || periodo === 'mes' || periodo === 'ano'
}

interface MovimentacaoPorCategoriaDTO {
  categoria_nome: string
  total_entradas: number
  total_saidas: number
  total_solicitacoes: number
  total_geral: number
}

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
    
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const dataLimite = new Date(hoje)
    dataLimite.setDate(hoje.getDate() + 15)
    
    let produtosVencidos = 0
    let produtosProximoVencimento = 0
    
    produtos?.forEach(p => {
      if (!p.data_validade) return
      
      const [ano, mes, dia] = p.data_validade.split('T')[0].split('-')
      const dataValidade = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      dataValidade.setHours(0, 0, 0, 0)
      
      if (dataValidade < hoje) {
        produtosVencidos++
      } else if (dataValidade <= dataLimite) {
        produtosProximoVencimento++
      }
    })

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
      produtosVencidos,
      produtosProximoVencimento,
      ultimasMovimentacoes
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dashboard' })
  }
})

router.get('/movimentacoes-por-categoria', authMiddleware, async (req, res) => {
  try {
    const periodoParam = req.query.periodo ?? 'mes'

    if (!validarPeriodo(periodoParam)) {
      return res.status(400).json({ error: 'Período inválido. Use: semana, mes ou ano' })
    }

    const dataInicio = calcularDataInicio(periodoParam)

    const { data, error } = await supabase
      .from('movimentacoes')
      .select(`
        tipo,
        quantidade,
        produto:produtos!produto_id (
          categoria:categorias!categoria_id (nome)
        )
      `)
      .gte('created_at', dataInicio.toISOString())

    if (error) throw error

    const map = new Map<string, MovimentacaoPorCategoriaDTO>()

    for (const mov of data ?? []) {
      const categoriaNome = (mov.produto as any)?.categoria?.nome ?? 'Sem categoria'

      if (!map.has(categoriaNome)) {
        map.set(categoriaNome, {
          categoria_nome: categoriaNome,
          total_entradas: 0,
          total_saidas: 0,
          total_solicitacoes: 0,
          total_geral: 0
        })
      }

      const entry = map.get(categoriaNome)!
      const qty = mov.quantidade ?? 0

      if (mov.tipo === 'ENTRADA') entry.total_entradas += qty
      else if (mov.tipo === 'SAIDA') entry.total_saidas += qty
      else if (mov.tipo === 'SOLICITACAO') entry.total_solicitacoes += qty

      entry.total_geral = entry.total_entradas + entry.total_saidas + entry.total_solicitacoes
    }

    return res.json(Array.from(map.values()))
  } catch (error) {
    console.error('Erro ao carregar dados do gráfico:', error)
    return res.status(500).json({ error: 'Erro ao carregar dados do gráfico' })
  }
})

export default router