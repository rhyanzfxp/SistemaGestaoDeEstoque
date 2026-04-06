import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

interface User {
  id: string
  nome: string
  email: string
  senha: string
  perfil: 'ADMIN' | 'GESTAO'
  ativo: boolean
  created_at?: string
}

interface Categoria {
  id: string
  nome: string
  descricao?: string
}

interface Fornecedor {
  id: string
  nome: string
  email?: string
  telefone?: string
}

interface Produto {
  id: string
  codigo: string
  nome: string
  categoria_id: string
  marca: string
  fornecedor_id: string
  quantidade_atual: number
  estoque_minimo: number
  ativo: boolean
  created_at?: string
}

interface Movimentacao {
  id: string
  tipo: 'ENTRADA' | 'SAIDA' | 'SOLICITACAO'
  produto_id: string
  quantidade: number
  usuario_id: string
  created_at: string
}

export const mockDatabase = {
  categorias: [] as Categoria[],
  fornecedores: [] as Fornecedor[],
  usuarios: [] as User[],
  produtos: [] as Produto[],
  movimentacoes: [] as Movimentacao[]
}

export async function initializeMockData() {
  if (mockDatabase.usuarios.length > 0) return

  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10)
  const hashedPasswordGestao = await bcrypt.hash('gestao123', 10)

  const adminUser: User = {
    id: randomUUID(),
    nome: 'Administrador',
    email: 'admin@escolayolanda.com',
    senha: hashedPasswordAdmin,
    perfil: 'ADMIN',
    ativo: true
  }

  const gestaoUser: User = {
    id: randomUUID(),
    nome: 'Gestão Escolar',
    email: 'gestao@escolayolanda.com',
    senha: hashedPasswordGestao,
    perfil: 'GESTAO',
    ativo: true
  }

  mockDatabase.usuarios.push(adminUser, gestaoUser)

  // Inicializar Categorias
  const categorias: Categoria[] = [
    { id: randomUUID(), nome: 'Alimentos Secos', descricao: 'Arroz, feijão, macarrão' },
    { id: randomUUID(), nome: 'Óleos e Gorduras', descricao: 'Óleos, manteigas' },
    { id: randomUUID(), nome: 'Temperos', descricao: 'Sal, açúcar, condimentos' },
    { id: randomUUID(), nome: 'Bebidas', descricao: 'Leite, suco, água' }
  ]

  mockDatabase.categorias.push(...categorias)

  // Inicializar Fornecedores
  const fornecedores: Fornecedor[] = [
    { id: randomUUID(), nome: 'Distribuidora A', email: 'contato@distA.com', telefone: '(11) 98765-4321' },
    { id: randomUUID(), nome: 'Fornecedor B', email: 'vendas@fornecB.com', telefone: '(11) 97654-3210' },
    { id: randomUUID(), nome: 'Supplies C', email: 'compras@suppliesC.com', telefone: '(11) 96543-2109' }
  ]

  mockDatabase.fornecedores.push(...fornecedores)

  // Inicializar Produtos com novos campos
  const produtos: Produto[] = [
    {
      id: randomUUID(),
      codigo: 'ARR001',
      nome: 'Arroz Branco 5kg',
      categoria_id: categorias[0].id,
      marca: 'Marca Premium',
      fornecedor_id: fornecedores[0].id,
      quantidade_atual: 50,
      estoque_minimo: 20,
      ativo: true,
      created_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      codigo: 'FEI002',
      nome: 'Feijão Preto 1kg',
      categoria_id: categorias[0].id,
      marca: 'Qualidade Total',
      fornecedor_id: fornecedores[0].id,
      quantidade_atual: 15, 
      estoque_minimo: 30,
      ativo: true,
      created_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      codigo: 'OLE003',
      nome: 'Óleo de Soja 900ml',
      categoria_id: categorias[1].id,
      marca: 'Oléo Fino',
      fornecedor_id: fornecedores[1].id,
      quantidade_atual: 80,
      estoque_minimo: 25,
      ativo: true,
      created_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      codigo: 'MAC004',
      nome: 'Macarrão Espaguete 500g',
      categoria_id: categorias[0].id,
      marca: 'Pasta Délicia',
      fornecedor_id: fornecedores[1].id,
      quantidade_atual: 100,
      estoque_minimo: 40,
      ativo: true,
      created_at: new Date().toISOString()
    }
  ]

  mockDatabase.produtos.push(...produtos)

  const agora = Date.now()

  const movimentacoes: Movimentacao[] = [
    {
      id: randomUUID(),
      tipo: 'ENTRADA',
      produto_id: produtos[0].id,
      quantidade: 50,
      usuario_id: adminUser.id,
      created_at: new Date(agora).toISOString()
    },
    {
      id: randomUUID(),
      tipo: 'SAIDA',
      produto_id: produtos[1].id,
      quantidade: 10,
      usuario_id: adminUser.id,
      created_at: new Date(agora - 3_600_000).toISOString()
    },
    {
      id: randomUUID(),
      tipo: 'ENTRADA',
      produto_id: produtos[2].id,
      quantidade: 80,
      usuario_id: adminUser.id,
      created_at: new Date(agora - 7_200_000).toISOString()
    },
    {
      id: randomUUID(),
      tipo: 'SOLICITACAO',
      produto_id: produtos[3].id,
      quantidade: 20,
      usuario_id: adminUser.id,
      created_at: new Date(agora - 10_800_000).toISOString()
    }
  ]

  mockDatabase.movimentacoes.push(...movimentacoes)

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Seed] Banco inicializado.')
    console.log('Admin: admin@escolayolanda.com / admin123')
    console.log('Gestao: gestao@escolayolanda.com / gestao123')
  } else {
    console.log('[Seed] Banco inicializado. Credenciais entregues ao responsável.')
  }
}