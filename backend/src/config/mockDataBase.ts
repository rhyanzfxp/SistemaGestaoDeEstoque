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

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'alimentício' | 'escolar' | 'escritório' | 'uso coletivo';
  perecivel: boolean;
  prazo_alerta: number;
  descricao?: string;
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
  produto_nome: string
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
  { id: randomUUID(), nome: 'Alimentos Secos', tipo: 'alimentício', perecivel: true, prazo_alerta: 3, descricao: 'Arroz, feijão' },
  { id: randomUUID(), nome: 'Óleos e Gorduras', tipo: 'alimentício', perecivel: true, prazo_alerta: 3, descricao: 'Óleos' },
  { id: randomUUID(), nome: 'Temperos', tipo: 'alimentício', perecivel: false, prazo_alerta: 30, descricao: 'Sal, açúcar' },
  { id: randomUUID(), nome: 'Bebidas', tipo: 'alimentício', perecivel: true, prazo_alerta: 3, descricao: 'Leite, suco' }
];

  mockDatabase.categorias.push(...categorias)

  // Inicializar Fornecedores
  const fornecedores: Fornecedor[] = [
    { id: randomUUID(), nome: 'Distribuidora A', email: 'contato@distA.com', telefone: '(11) 98765-4321' },
    { id: randomUUID(), nome: 'Fornecedor B', email: 'vendas@fornecB.com', telefone: '(11) 97654-3210' },
    { id: randomUUID(), nome: 'Supplies C', email: 'compras@suppliesC.com', telefone: '(11) 96543-2109' }
  ]

  mockDatabase.fornecedores.push(...fornecedores)

  // Produtos e movimentações serão criados pelo usuário

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Seed] Banco inicializado.')
    console.log('Admin: admin@escolayolanda.com / admin123')
    console.log('Gestao: gestao@escolayolanda.com / gestao123')
  } else {
    console.log('[Seed] Banco inicializado. Credenciais entregues ao responsável.')
  }
}