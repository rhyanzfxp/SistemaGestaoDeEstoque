CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) CHECK (perfil IN ('ADMIN', 'GESTAO')) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) CHECK (tipo IN ('alimentício', 'escolar', 'escritório', 'uso coletivo')) NOT NULL,
  perecivel BOOLEAN DEFAULT false,
  prazo_alerta INTEGER DEFAULT 30,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  data_validade DATE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  quantidade_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) CHECK (tipo IN ('ENTRADA', 'SAIDA', 'SOLICITACAO')) NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  produto_nome VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario ON movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created_at ON movimentacoes(created_at DESC);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES
  ('Administrador', 'admin@escolayolanda.com', '$2b$10$oheMrnKPiRDdP5kUxVz2a.8O6xbF5pGM7Mn.wDjlVW918qsQArAZ2', 'ADMIN', true),
  ('Gestão Escolar', 'gestao@escolayolanda.com', '$2b$10$xR9.g8smQxaSG1aKYpxM7.rxRr9ZP4uOiuOcpauoslavQGDSgg6lu', 'GESTAO', true)
ON CONFLICT (email) DO NOTHING;


INSERT INTO categorias (nome, tipo, perecivel, prazo_alerta, descricao) VALUES
  ('Alimentos Secos', 'alimentício', true, 3, 'Arroz, feijão'),
  ('Óleos e Gorduras', 'alimentício', true, 3, 'Óleos'),
  ('Temperos', 'alimentício', false, 30, 'Sal, açúcar'),
  ('Bebidas', 'alimentício', true, 3, 'Leite, suco')
ON CONFLICT DO NOTHING;


INSERT INTO fornecedores (nome, email, telefone) VALUES
  ('Distribuidora A', 'contato@distA.com', '(11) 98765-4321'),
  ('Fornecedor B', 'vendas@fornecB.com', '(11) 97654-3210'),
  ('Supplies C', 'compras@suppliesC.com', '(11) 96543-2109')
ON CONFLICT DO NOTHING;


ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Permitir leitura para usuários autenticados" ON usuarios FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Permitir todas operações para service_role" ON usuarios FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Permitir leitura para usuários autenticados" ON categorias FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Permitir todas operações para service_role" ON categorias FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Permitir leitura para usuários autenticados" ON fornecedores FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Permitir todas operações para service_role" ON fornecedores FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Permitir leitura para usuários autenticados" ON produtos FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Permitir todas operações para service_role" ON produtos FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Permitir leitura para usuários autenticados" ON movimentacoes FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Permitir todas operações para service_role" ON movimentacoes FOR ALL USING (auth.role() = 'service_role');
