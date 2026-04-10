import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.get('/categorias', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome')

    if (error) throw error
    res.json(categorias)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

router.get('/fornecedores', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data: fornecedores, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome')

    if (error) throw error
    res.json(fornecedores)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores' })
  }
})

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { search, categoria_id, status, page = '1', limit = '10' } = req.query

    let query = supabase
      .from('produtos')
      .select(`
        *,
        categorias:categoria_id (nome),
        fornecedores:fornecedor_id (nome)
      `, { count: 'exact' })

    
    if (status === 'ativo') {
      query = query.eq('ativo', true)
    } else if (status === 'inativo') {
      query = query.eq('ativo', false)
    }

    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id)
    }

    if (search) {
      query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`)
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const startIndex = (pageNum - 1) * limitNum

    const { data: produtos, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + limitNum - 1)

    if (error) throw error

    const enrichedProducts = produtos?.map(p => ({
      ...p,
      categoria_nome: (p.categorias as any)?.nome || '',
      fornecedor_nome: (p.fornecedores as any)?.nome || '',
      estoque_status: p.quantidade_atual <= p.estoque_minimo ? 'crítico' : 'normal'
    })) || []

    res.json({
      data: enrichedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' })
  }
})

router.post('/', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { codigo, nome, data_validade, categoria_id, fornecedor_id, quantidade_atual, estoque_minimo } = req.body

    if (!codigo || !nome || !categoria_id || !fornecedor_id || quantidade_atual === undefined || estoque_minimo === undefined) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    const { data: existingProduct } = await supabase
      .from('produtos')
      .select('id')
      .eq('codigo', codigo)
      .single()

    if (existingProduct) {
      return res.status(400).json({ error: 'Código do produto já existe' })
    }

    const { data: novoProduct, error } = await supabase
      .from('produtos')
      .insert({
        codigo,
        nome,
        data_validade: data_validade || null,
        categoria_id,
        fornecedor_id,
        quantidade_atual: parseInt(quantidade_atual),
        estoque_minimo: parseInt(estoque_minimo),
        ativo: true
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(novoProduct)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' })
  }
})

router.put('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { codigo, nome, data_validade, categoria_id, fornecedor_id, quantidade_atual, estoque_minimo, ativo } = req.body

    if (codigo) {
      const { data: existingProduct } = await supabase
        .from('produtos')
        .select('id')
        .eq('codigo', codigo)
        .neq('id', id)
        .single()

      if (existingProduct) {
        return res.status(400).json({ error: 'Código do produto já existe' })
      }
    }

    const updateData: any = {}
    if (codigo) updateData.codigo = codigo
    if (nome) updateData.nome = nome
    if (data_validade !== undefined) updateData.data_validade = data_validade || null
    if (categoria_id) updateData.categoria_id = categoria_id
    if (fornecedor_id) updateData.fornecedor_id = fornecedor_id
    if (quantidade_atual !== undefined) updateData.quantidade_atual = parseInt(quantidade_atual)
    if (estoque_minimo !== undefined) updateData.estoque_minimo = parseInt(estoque_minimo)
    if (ativo !== undefined) updateData.ativo = ativo

    const { data: produto, error } = await supabase
      .from('produtos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    res.json(produto)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
})

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: movimentacoes } = await supabase
      .from('movimentacoes')
      .select('id')
      .eq('produto_id', id)
      .limit(1)

    if (movimentacoes && movimentacoes.length > 0) {
      return res.status(422).json({ 
        error: 'Este produto possui movimentações registradas e não pode ser excluído. Utilize a opção de inativar o produto.',
        canInactivate: true
      })
    }

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      message: 'Produto excluído com sucesso'
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir produto' })
  }
})

router.patch('/:id/inativar', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: produto, error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    res.json({
      message: 'Produto inativado com sucesso',
      product: produto
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inativar produto' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: produto, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categorias:categoria_id (nome),
        fornecedores:fornecedor_id (nome)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    res.json({
      ...produto,
      categoria_nome: (produto.categorias as any)?.nome || '',
      fornecedor_nome: (produto.fornecedores as any)?.nome || ''
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' })
  }
})

export default router
