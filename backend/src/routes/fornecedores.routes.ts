import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

const router = Router()

// Listar todos os fornecedores
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '10' } = req.query

    let query = supabase
      .from('fornecedores')
      .select('*, produtos(count)', { count: 'exact' })

    if (search) {
      query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,contato.ilike.%${search}%`)
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const startIndex = (pageNum - 1) * limitNum

    const { data: fornecedores, error, count } = await query
      .order('nome', { ascending: true })
      .range(startIndex, startIndex + limitNum - 1)

    if (error) throw error

    const enrichedFornecedores = fornecedores?.map(f => ({
      ...f,
      total_produtos: Array.isArray(f.produtos) ? f.produtos.length : 0
    })) || []

    res.json({
      data: enrichedFornecedores,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores' })
  }
})

// Buscar fornecedor por ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data: fornecedor, error } = await supabase
      .from('fornecedores')
      .select(`
        *,
        produtos(id, nome, codigo)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' })
    }

    res.json(fornecedor)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedor' })
  }
})

// Criar novo fornecedor
router.post('/', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { nome, cnpj, email, telefone, contato } = req.body

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    if (cnpj) {
      const { data: existingFornecedor } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('cnpj', cnpj)
        .single()

      if (existingFornecedor) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' })
      }
    }

    const { data: novoFornecedor, error } = await supabase
      .from('fornecedores')
      .insert({
        nome,
        cnpj: cnpj || null,
        email: email || null,
        telefone: telefone || null,
        contato: contato || null
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(novoFornecedor)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar fornecedor' })
  }
})

// Atualizar fornecedor
router.put('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { nome, cnpj, email, telefone, contato } = req.body

    if (cnpj) {
      const { data: existingFornecedor } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('cnpj', cnpj)
        .neq('id', id)
        .single()

      if (existingFornecedor) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' })
      }
    }

    const updateData: any = {}
    if (nome !== undefined) updateData.nome = nome
    if (cnpj !== undefined) updateData.cnpj = cnpj || null
    if (email !== undefined) updateData.email = email || null
    if (telefone !== undefined) updateData.telefone = telefone || null
    if (contato !== undefined) updateData.contato = contato || null

    const { data: fornecedor, error } = await supabase
      .from('fornecedores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' })
    }

    res.json(fornecedor)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' })
  }
})

// Deletar fornecedor
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Verificar se existem produtos vinculados
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id')
      .eq('fornecedor_id', id)
      .limit(1)

    if (produtos && produtos.length > 0) {
      return res.status(422).json({ 
        error: 'Este fornecedor possui produtos vinculados e não pode ser excluído.',
        cannotDelete: true
      })
    }

    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      message: 'Fornecedor excluído com sucesso'
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir fornecedor' })
  }
})

export default router
