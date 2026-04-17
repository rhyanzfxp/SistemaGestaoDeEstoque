import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      tipo, 
      produto_id, 
      categoria_id, 
      usuario_id, 
      data_inicio, 
      data_fim, 
      page = '1', 
      limit = '10' 
    } = req.query

    let query = supabase
      .from('movimentacoes')
      .select(`
        *,
        usuario:usuarios(nome),
        produto:produtos(nome, categoria_id, categorias(nome))
      `, { count: 'exact' })

    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (produto_id) {
      query = query.eq('produto_id', produto_id)
    }
    if (usuario_id) {
      query = query.eq('usuario_id', usuario_id)
    }
    if (data_inicio) {
      query = query.gte('created_at', data_inicio + 'T00:00:00')
    }
    if (data_fim) {
      query = query.lte('created_at', data_fim + 'T23:59:59')
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const startIndex = (pageNum - 1) * limitNum

    const { data: movimentacoes, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + limitNum - 1)

    if (error) throw error

    const formattedData = movimentacoes?.map(mov => ({
      id: mov.id,
      tipo: mov.tipo,
      produto_id: mov.produto_id,
      produto_nome: mov.produto_nome,
      categoria_nome: mov.produto?.categorias?.nome || '-',
      quantidade: mov.quantidade,
      usuario_nome: mov.usuario?.nome || 'Usuário desconhecido',
      observacao: mov.observacao,
      created_at: mov.created_at
    })) || []

    res.json({
      data: formattedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    res.status(500).json({ error: 'Erro ao buscar movimentações' })
  }
})

router.get('/entradas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', data_inicio, data_fim } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const startIndex = (pageNum - 1) * limitNum

    let query = supabase
      .from('movimentacoes')
      .select(`
        *,
        usuario:usuarios(nome),
        fornecedor:fornecedores(nome)
      `, { count: 'exact' })
      .eq('tipo', 'ENTRADA')

    if (data_inicio) {
      query = query.gte('created_at', data_inicio + 'T00:00:00')
    }
    if (data_fim) {
      query = query.lte('created_at', data_fim + 'T23:59:59')
    }

    const { data: movimentacoes, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + limitNum - 1)

    if (error) throw error

    const formattedData = movimentacoes?.map(mov => ({
      id: mov.id,
      produto_id: mov.produto_id,
      produto_nome: mov.produto_nome,
      quantidade: mov.quantidade,
      fornecedor_id: mov.fornecedor_id,
      fornecedor_nome: mov.fornecedor?.nome || '-',
      numero_nf: mov.observacao?.match(/NF:\s*(\S+)/)?.[1] || '-',
      usuario_nome: mov.usuario?.nome || 'Usuário desconhecido',
      created_at: mov.created_at,
      observacao: mov.observacao
    })) || []

    res.json({
      data: formattedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar entradas:', error)
    res.status(500).json({ error: 'Erro ao buscar entradas' })
  }
})

router.get('/saidas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', data_inicio, data_fim } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const startIndex = (pageNum - 1) * limitNum

    let query = supabase
      .from('movimentacoes')
      .select(`
        *,
        usuario:usuarios(nome)
      `, { count: 'exact' })
      .eq('tipo', 'SAIDA')

    if (data_inicio) {
      query = query.gte('created_at', data_inicio + 'T00:00:00')
    }
    if (data_fim) {
      query = query.lte('created_at', data_fim + 'T23:59:59')
    }

    const { data: movimentacoes, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + limitNum - 1)

    if (error) throw error

    const formattedData = movimentacoes?.map(mov => ({
      id: mov.id,
      produto_id: mov.produto_id,
      produto_nome: mov.produto_nome,
      quantidade: mov.quantidade,
      motivo: mov.observacao?.match(/Motivo:\s*([^\n]+)/)?.[1] || mov.observacao || '-',
      usuario_nome: mov.usuario?.nome || 'Usuário desconhecido',
      created_at: mov.created_at,
      observacao: mov.observacao
    })) || []

    res.json({
      data: formattedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar saídas:', error)
    res.status(500).json({ error: 'Erro ao buscar saídas' })
  }
})

router.post('/entrada', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { produto_id, quantidade, fornecedor_id, numero_nf, data, observacao } = req.body
    const usuario_id = (req as any).user.id

    if (!produto_id || !quantidade || quantidade <= 0) {
      return res.status(400).json({ error: 'Produto e quantidade são obrigatórios' })
    }

    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('nome, quantidade_atual')
      .eq('id', produto_id)
      .single()

    if (produtoError || !produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    let obs = observacao || ''
    if (numero_nf) {
      obs = `NF: ${numero_nf}${obs ? '\n' + obs : ''}`
    }

    let dataMovimentacao = new Date().toISOString()
    if (data) {
      const dataFornecida = new Date(data + 'T00:00:00')
      const agora = new Date()
      dataFornecida.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds())
      dataMovimentacao = dataFornecida.toISOString()
    }

    const { data: movimentacao, error: movError } = await supabase
      .from('movimentacoes')
      .insert({
        tipo: 'ENTRADA',
        produto_id,
        produto_nome: produto.nome,
        quantidade: parseInt(quantidade),
        usuario_id,
        fornecedor_id: fornecedor_id || null,
        observacao: obs,
        created_at: dataMovimentacao
      })
      .select()
      .single()

    if (movError) throw movError

    const novaQuantidade = produto.quantidade_atual + parseInt(quantidade)
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ quantidade_atual: novaQuantidade })
      .eq('id', produto_id)

    if (updateError) {
      await supabase.from('movimentacoes').delete().eq('id', movimentacao.id)
      throw updateError
    }

    res.status(201).json({ 
      message: 'Entrada registrada com sucesso',
      movimentacao 
    })
  } catch (error) {
    console.error('Erro ao registrar entrada:', error)
    res.status(500).json({ error: 'Erro ao registrar entrada' })
  }
})

router.post('/saida', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { produto_id, quantidade, motivo, data, observacao } = req.body
    const usuario_id = (req as any).user.id

    if (!produto_id || !quantidade || quantidade <= 0) {
      return res.status(400).json({ error: 'Produto e quantidade são obrigatórios' })
    }

    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('nome, quantidade_atual')
      .eq('id', produto_id)
      .single()

    if (produtoError || !produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    if (produto.quantidade_atual < parseInt(quantidade)) {
      return res.status(400).json({ 
        error: `Estoque insuficiente. Disponível: ${produto.quantidade_atual} unidades` 
      })
    }

    let obs = observacao || ''
    if (motivo) {
      obs = `Motivo: ${motivo}${obs ? '\n' + obs : ''}`
    }

    let dataMovimentacao = new Date().toISOString()
    if (data) {
      const dataFornecida = new Date(data + 'T00:00:00')
      const agora = new Date()
      dataFornecida.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds())
      dataMovimentacao = dataFornecida.toISOString()
    }

    const { data: movimentacao, error: movError } = await supabase
      .from('movimentacoes')
      .insert({
        tipo: 'SAIDA',
        produto_id,
        produto_nome: produto.nome,
        quantidade: parseInt(quantidade),
        usuario_id,
        fornecedor_id: null,
        observacao: obs,
        created_at: dataMovimentacao
      })
      .select()
      .single()

    if (movError) throw movError

    const novaQuantidade = produto.quantidade_atual - parseInt(quantidade)
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ quantidade_atual: novaQuantidade })
      .eq('id', produto_id)

    if (updateError) {
      await supabase.from('movimentacoes').delete().eq('id', movimentacao.id)
      throw updateError
    }

    res.status(201).json({ 
      message: 'Saída registrada com sucesso',
      movimentacao 
    })
  } catch (error) {
    console.error('Erro ao registrar saída:', error)
    res.status(500).json({ error: 'Erro ao registrar saída' })
  }
})

router.put('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { quantidade, fornecedor_id, numero_nf, motivo, data, observacao } = req.body

    const { data: movimentacaoAtual, error: movError } = await supabase
      .from('movimentacoes')
      .select('*, produto:produtos(quantidade_atual)')
      .eq('id', id)
      .single()

    if (movError || !movimentacaoAtual) {
      return res.status(404).json({ error: 'Movimentação não encontrada' })
    }

    const quantidadeNova = parseInt(quantidade)
    const quantidadeAntiga = movimentacaoAtual.quantidade
    const diferencaQuantidade = quantidadeNova - quantidadeAntiga

    if (quantidadeNova <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' })
    }

    const estoqueAtual = movimentacaoAtual.produto.quantidade_atual
    let novoEstoque = estoqueAtual

    if (movimentacaoAtual.tipo === 'ENTRADA') {
      novoEstoque = estoqueAtual + diferencaQuantidade
    } else if (movimentacaoAtual.tipo === 'SAIDA') {
      novoEstoque = estoqueAtual - diferencaQuantidade
      
      if (novoEstoque < 0) {
        return res.status(400).json({ 
          error: `Estoque insuficiente. Disponível: ${estoqueAtual + quantidadeAntiga} unidades` 
        })
      }
    }

    let obs = observacao || ''
    if (movimentacaoAtual.tipo === 'ENTRADA' && numero_nf) {
      obs = `NF: ${numero_nf}${obs ? '\n' + obs : ''}`
    } else if (movimentacaoAtual.tipo === 'SAIDA' && motivo) {
      obs = `Motivo: ${motivo}${obs ? '\n' + obs : ''}`
    }

    let dataMovimentacao = movimentacaoAtual.created_at
    if (data) {
      const dataFornecida = new Date(data + 'T00:00:00')
      const dataOriginal = new Date(movimentacaoAtual.created_at)
      dataFornecida.setHours(dataOriginal.getHours(), dataOriginal.getMinutes(), dataOriginal.getSeconds())
      dataMovimentacao = dataFornecida.toISOString()
    }

    const updateData: any = {
      quantidade: quantidadeNova,
      observacao: obs,
      created_at: dataMovimentacao
    }

    if (movimentacaoAtual.tipo === 'ENTRADA' && fornecedor_id !== undefined) {
      updateData.fornecedor_id = fornecedor_id || null
    }

    const { error: updateMovError } = await supabase
      .from('movimentacoes')
      .update(updateData)
      .eq('id', id)

    if (updateMovError) throw updateMovError

    const { error: updateEstoqueError } = await supabase
      .from('produtos')
      .update({ quantidade_atual: novoEstoque })
      .eq('id', movimentacaoAtual.produto_id)

    if (updateEstoqueError) {
      await supabase
        .from('movimentacoes')
        .update({
          quantidade: quantidadeAntiga,
          observacao: movimentacaoAtual.observacao,
          created_at: movimentacaoAtual.created_at
        })
        .eq('id', id)
      throw updateEstoqueError
    }

    res.json({ 
      message: 'Movimentação atualizada com sucesso',
      estoque_atualizado: novoEstoque
    })
  } catch (error) {
    console.error('Erro ao editar movimentação:', error)
    res.status(500).json({ error: 'Erro ao editar movimentação' })
  }
})

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: movimentacao, error: movError } = await supabase
      .from('movimentacoes')
      .select('*')
      .eq('id', id)
      .single()

    if (movError || !movimentacao) {
      return res.status(404).json({ error: 'Movimentação não encontrada' })
    }

    console.log('Excluindo movimentação (sem alterar estoque):', {
      tipo: movimentacao.tipo,
      quantidade: movimentacao.quantidade,
      produto: movimentacao.produto_nome
    })

    const { error: deleteError } = await supabase
      .from('movimentacoes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    console.log('Movimentação excluída com sucesso. Estoque mantido.')

    res.json({ 
      message: 'Movimentação excluída com sucesso. Estoque mantido.',
      estoque_mantido: true
    })
  } catch (error) {
    console.error('Erro ao excluir movimentação:', error)
    res.status(500).json({ error: 'Erro ao excluir movimentação' })
  }
})

router.delete('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { error: deleteError } = await supabase
      .from('movimentacoes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) throw deleteError

    res.json({ 
      message: 'Histórico de movimentações limpo com sucesso. Os estoques atuais foram mantidos.'
    })
  } catch (error) {
    console.error('Erro ao limpar histórico:', error)
    res.status(500).json({ error: 'Erro ao limpar histórico de movimentações' })
  }
})

export default router
