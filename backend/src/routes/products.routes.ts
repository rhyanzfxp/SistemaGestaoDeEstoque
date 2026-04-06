import { Router, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { mockDatabase } from '../config/mockDataBase'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.get('/categorias', authMiddleware, (req: Request, res: Response) => {
  try {
    res.json(mockDatabase.categorias)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

router.get('/fornecedores', authMiddleware, (req: Request, res: Response) => {
  try {
    res.json(mockDatabase.fornecedores)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores' })
  }
})

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { search, categoria_id, status, page = '1', limit = '10' } = req.query

    let produtos = mockDatabase.produtos

    if (categoria_id) {
      produtos = produtos.filter(p => p.categoria_id === categoria_id)
    }

    if (status) {
      const isActive = status === 'ativo'
      produtos = produtos.filter(p => p.ativo === isActive)
    }

    if (search) {
      produtos = produtos.filter(p =>
        p.nome.toLowerCase().includes((search as string).toLowerCase()) ||
        p.codigo.toLowerCase().includes((search as string).toLowerCase())
      )
    }

    const enrichedProducts = produtos.map(p => {
      const categoria = mockDatabase.categorias.find(c => c.id === p.categoria_id)
      const fornecedor = mockDatabase.fornecedores.find(f => f.id === p.fornecedor_id)
      return {
        ...p,
        categoria_nome: categoria?.nome || '',
        fornecedor_nome: fornecedor?.nome || '',
        estoque_status: p.quantidade_atual <= p.estoque_minimo ? 'crítico' : 'normal'
      }
    })

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10))
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum

    const paginatedProducts = enrichedProducts.slice(startIndex, endIndex)

    res.json({
      data: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: enrichedProducts.length,
        totalPages: Math.ceil(enrichedProducts.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const produto = mockDatabase.produtos.find(p => p.id === id)

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    const categoria = mockDatabase.categorias.find(c => c.id === produto.categoria_id)
    const fornecedor = mockDatabase.fornecedores.find(f => f.id === produto.fornecedor_id)

    res.json({
      ...produto,
      categoria_nome: categoria?.nome || '',
      fornecedor_nome: fornecedor?.nome || ''
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' })
  }
})

router.post('/', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { codigo, nome, categoria_id, marca, fornecedor_id, quantidade_atual, estoque_minimo } = req.body

    if (!codigo || !nome || !categoria_id || !marca || !fornecedor_id || quantidade_atual === undefined || estoque_minimo === undefined) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    // Verificar se código já existe
    const codigoExists = mockDatabase.produtos.some(p => p.codigo === codigo)
    if (codigoExists) {
      return res.status(400).json({ error: 'Código do produto já existe' })
    }

    const categoriaExists = mockDatabase.categorias.some(c => c.id === categoria_id)
    const fornecedorExists = mockDatabase.fornecedores.some(f => f.id === fornecedor_id)

    if (!categoriaExists || !fornecedorExists) {
      return res.status(400).json({ error: 'Categoria ou fornecedor inválido' })
    }

    const novoProduct = {
      id: randomUUID(),
      codigo,
      nome,
      categoria_id,
      marca,
      fornecedor_id,
      quantidade_atual: parseInt(quantidade_atual),
      estoque_minimo: parseInt(estoque_minimo),
      ativo: true,
      created_at: new Date().toISOString()
    }

    mockDatabase.produtos.push(novoProduct)

    res.status(201).json(novoProduct)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' })
  }
})

router.put('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { codigo, nome, categoria_id, marca, fornecedor_id, quantidade_atual, estoque_minimo } = req.body

    const produto = mockDatabase.produtos.find(p => p.id === id)
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    if (codigo && codigo !== produto.codigo) {
      const codigoExists = mockDatabase.produtos.some(p => p.codigo === codigo && p.id !== id)
      if (codigoExists) {
        return res.status(400).json({ error: 'Código do produto já existe' })
      }
      produto.codigo = codigo
    }

    if (categoria_id && !mockDatabase.categorias.some(c => c.id === categoria_id)) {
      return res.status(400).json({ error: 'Categoria inválida' })
    }

    if (fornecedor_id && !mockDatabase.fornecedores.some(f => f.id === fornecedor_id)) {
      return res.status(400).json({ error: 'Fornecedor inválido' })
    }

    if (nome) produto.nome = nome
    if (categoria_id) produto.categoria_id = categoria_id
    if (marca) produto.marca = marca
    if (fornecedor_id) produto.fornecedor_id = fornecedor_id
    if (quantidade_atual !== undefined) produto.quantidade_atual = parseInt(quantidade_atual)
    if (estoque_minimo !== undefined) produto.estoque_minimo = parseInt(estoque_minimo)

    res.json(produto)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
})

router.patch('/:id/inativar', authMiddleware, requireRole('ADMIN', 'GESTAO'), (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const produto = mockDatabase.produtos.find(p => p.id === id)

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }

    produto.ativo = false

    res.json({
      message: 'Produto inativado com sucesso',
      product: produto
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inativar produto' })
  }
})

export default router
