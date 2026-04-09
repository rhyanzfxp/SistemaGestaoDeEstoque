# Sistema de Gestão de Estoque - Escola Yolanda Queiroz

Sistema completo de gerenciamento de estoque desenvolvido para controle de produtos, categorias, fornecedores e movimentações. Construído com React, TypeScript, Node.js e Supabase.

## Sobre o Projeto

O Sistema de Gestão de Estoque foi desenvolvido para facilitar o controle de inventário da Escola Yolanda Queiroz, permitindo o gerenciamento eficiente de produtos alimentícios, escolares, de escritório e de uso coletivo. O sistema oferece controle de estoque mínimo, registro de movimentações e alertas automáticos.

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Supabase (PostgreSQL)
- JWT (autenticação)
- bcryptjs (criptografia de senhas)

## Funcionalidades

### Autenticação e Autorização
- Sistema de login com JWT
- Dois níveis de acesso: ADMIN e GESTAO
- Proteção de rotas por perfil de usuário

### Dashboard
- Visão geral do estoque
- Total de produtos cadastrados
- Total de itens em estoque
- Produtos com estoque mínimo
- Histórico de movimentações recentes

### Gerenciamento de Usuários (ADMIN)
- Criar, editar e excluir usuários
- Definir perfis de acesso
- Ativar/desativar usuários

### Gerenciamento de Produtos
- Cadastro completo de produtos
- Código único por produto
- Vinculação com categorias e fornecedores
- Controle de estoque mínimo
- Status ativo/inativo
- Filtros e busca avançada

### Categorias
- Cadastro de categorias personalizadas
- Tipos: alimentício, escolar, escritório, uso coletivo
- Controle de perecibilidade
- Prazo de alerta configurável

### Movimentações de Estoque
- Registro de entradas
- Registro de saídas
- Histórico completo de movimentações
- Validação de saldo disponível
- Rastreamento por usuário

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Conta no Supabase

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/rhyanzfxp/SistemaGestaoDeEstoque.git
cd SistemaGestaoDeEstoque
```

### 2. Configure o Supabase

1. Acesse [Supabase](https://supabase.com) e crie um novo projeto
2. No painel do Supabase, vá em **SQL Editor**
3. Execute o script `supabase-schema.sql` disponível na raiz do projeto
4. Anote as credenciais do projeto (URL e chaves de API)

### 3. Configure o Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` baseado no `.env.example`:

```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# JWT
JWT_SECRET=sua_chave_secreta_jwt
```

### 4. Configure o Frontend

```bash
cd client
npm install
```

Crie o arquivo `.env` baseado no `.env.example`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_API_URL=http://localhost:3000
```

## Executando o Projeto

### Backend

```bash
cd backend
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### Frontend

```bash
cd client
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## Credenciais de Acesso

Após executar o script SQL no Supabase, os seguintes usuários estarão disponíveis:

**Administrador**
- Email: admin@escolayolanda.com
- Senha: admin123

**Gestão**
- Email: gestao@escolayolanda.com
- Senha: gestao123

## Estrutura do Projeto

```
SistemaGestaoDeEstoque/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── categories.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── products.routes.ts
│   │   │   └── users.routes.ts
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── supabase-schema.sql
└── README.md
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

### Usuários (ADMIN)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Produtos
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto
- `PATCH /api/produtos/:id/inativar` - Inativar produto
- `GET /api/produtos/:id` - Buscar produto por ID
- `POST /api/produtos/:id/movimentar` - Registrar movimentação

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/:id` - Atualizar categoria

### Fornecedores
- `GET /api/produtos/fornecedores` - Listar fornecedores

## Segurança

- Senhas criptografadas com bcrypt
- Autenticação via JWT
- Proteção de rotas por perfil de usuário
- Row Level Security (RLS) no Supabase
- Variáveis de ambiente para dados sensíveis

## Build para Produção

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd client
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

Desenvolvido por [rhyanzfxp](https://github.com/rhyanzfxp)

## Suporte

Para reportar bugs ou solicitar novas funcionalidades, abra uma [issue](https://github.com/rhyanzfxp/SistemaGestaoDeEstoque/issues) no GitHub.
