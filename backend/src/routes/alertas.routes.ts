import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'
import { getIO } from '../utils/socket'

const router = Router()

router.get('/', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { visualizado } = req.query

    let query = supabase
      .from('alertas')
      .select('id, tipo, produto_id, produto_nome, descricao, visualizado, visualizado_em, created_at')
      .order('created_at', { ascending: false })

    if (visualizado === 'false' || visualizado === undefined) {
      query = query.eq('visualizado', false)
    } else if (visualizado === 'true') {
      query = query.eq('visualizado', true)
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data ?? [])
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar alertas' })
  }
})

router.get('/count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('alertas')
      .select('*', { count: 'exact', head: true })
      .eq('visualizado', false)

    if (error) throw error

    res.json({ count: count ?? 0 })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao contar alertas' })
  }
})

router.patch('/:id/visualizar', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('alertas')
      .update({
        visualizado: true,
        visualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Alerta não encontrado' })

    getIO().emit('alertas_atualizados')

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar alerta como visualizado' })
  }
})

router.patch('/visualizar-todos', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('alertas')
      .update({
        visualizado: true,
        visualizado_em: new Date().toISOString()
      })
      .eq('visualizado', false)

    if (error) throw error

    getIO().emit('alertas_atualizados')

    res.json({ message: 'Todos os alertas marcados como visualizados' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar alertas como visualizados' })
  }
})

export async function runEstoqueMinimoJob() {
  try {
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('id, nome, quantidade_atual, estoque_minimo')
      .eq('ativo', true)

    if (prodError) throw prodError

    const criticos = produtos?.filter(p => p.quantidade_atual <= p.estoque_minimo) || []

    let criados = 0

    for (const p of criticos) {
      const { data: existing } = await supabase
        .from('alertas')
        .select('id')
        .eq('produto_id', p.id)
        .eq('tipo', 'ESTOQUE_MINIMO')
        .maybeSingle()

      if (existing) continue

      await supabase.from('alertas').insert({
        tipo: 'ESTOQUE_MINIMO',
        produto_id: p.id,
        produto_nome: p.nome,
        descricao: `Estoque de "${p.nome}" está crítico: ${p.quantidade_atual} unidade(s) (mínimo: ${p.estoque_minimo})`,
        visualizado: false
      })
      criados++
    }

    if (criados > 0) getIO().emit('alertas_atualizados')
    console.log(`[CronJob] Estoque mínimo: ${criticos.length} crítico(s), ${criados} alerta(s) novo(s) criado(s)`)
  } catch (err) {
    console.error('[CronJob] Erro no job de estoque mínimo:', err)
  }
}

export async function runVencimentoJob() {
  try {
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('id, nome, data_validade')
      .eq('ativo', true)
      .not('data_validade', 'is', null)

    if (prodError) throw prodError

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    let criados = 0

    for (const p of produtos || []) {
      const diasAlerta = 30

      const [ano, mes, dia] = (p.data_validade as string).split('T')[0].split('-')
      const validade = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      validade.setHours(0, 0, 0, 0)

      const diffMs = validade.getTime() - hoje.getTime()
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDias > diasAlerta) continue

      const tipo = diffDias < 0 ? 'VENCIDO' : 'VENCIMENTO_PROXIMO'

      const { data: existing } = await supabase
        .from('alertas')
        .select('id')
        .eq('produto_id', p.id)
        .eq('tipo', tipo)
        .maybeSingle()

      if (existing) continue

      const descricao = diffDias < 0
        ? `Produto "${p.nome}" está vencido desde ${validade.toLocaleDateString('pt-BR')}`
        : diffDias === 0
          ? `Produto "${p.nome}" vence hoje!`
          : `Produto "${p.nome}" vence em ${diffDias} dia(s) (${validade.toLocaleDateString('pt-BR')})`

      await supabase.from('alertas').insert({
        tipo,
        produto_id: p.id,
        produto_nome: p.nome,
        descricao,
        visualizado: false
      })
      criados++
    }

    if (criados > 0) getIO().emit('alertas_atualizados')
    console.log(`[CronJob] Vencimento: ${criados} alerta(s) novo(s) criado(s)`)
  } catch (err) {
    console.error('[CronJob] Erro no job de vencimento:', err)
  }
}

export default router

