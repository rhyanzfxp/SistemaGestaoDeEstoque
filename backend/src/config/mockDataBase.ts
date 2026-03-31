import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

interface User {
  id: string
  nome: string
  email: string
  senha: string
  perfil: 'ADMIN' | 'ESTOQUISTA' | 'FUNCIONARIO' | 'GESTAO'
  ativo: boolean
}

interface Produto {
  id: string
  nome: string
  quantidade_atual: number
  estoque_minimo: number
  ativo: boolean
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
  usuarios: [] as User[],
  produtos: [] as Produto[],
  movimentacoes: [] as Movimentacao[]
}

export async function initializeMockData() {
  
  if (mockDatabase.usuarios.length > 0) return

  
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const adminUser: User = {
    id: randomUUID(),
    nome: 'Administrador',
    email: 'admin@escolayolanda.com',
    senha: hashedPassword,
    perfil: 'ADMIN',
    ativo: true
  }

  mockDatabase.usuarios.push(adminUser)


  const produtos: Produto[] = [
    {
      id: randomUUID(),
      nome: 'Arroz Branco 5kg',
      quantidade_atual: 50,
      estoque_minimo: 20,
      ativo: true
    },
    {
      id: randomUUID(),
      nome: 'Feijão Preto 1kg',
      quantidade_atual: 15, 
      estoque_minimo: 30,
      ativo: true
    },
    {
      id: randomUUID(),
      nome: 'Óleo de Soja 900ml',
      quantidade_atual: 80,
      estoque_minimo: 25,
      ativo: true
    },
    {
      id: randomUUID(),
      nome: 'Macarrão Espaguete 500g',
      quantidade_atual: 100,
      estoque_minimo: 40,
      ativo: true
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
    console.log(' [Seed] Banco inicializado.')
    console.log('   → Admin: admin@escolayolanda.com / admin123')
  } else {
    console.log(' [Seed] Banco inicializado. Credenciais entregues ao responsável.')
  }
}