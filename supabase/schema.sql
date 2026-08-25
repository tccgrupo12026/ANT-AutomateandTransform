-- ============================================================================
-- ANT (Automate and Transform) — Schema Completo para Supabase (PostgreSQL)
-- ============================================================================
-- Este script define a estrutura de dados relacional e as políticas de segurança
-- Row Level Security (RLS) para as tabelas 'companies' e 'products'.
-- ============================================================================

-- Extensão para geração de UUIDs (caso ainda não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELA: public.companies
-- Armazena os dados cadastrais da microempresa vinculada ao usuário autenticado.
-- Relacionamento 1:1 com auth.users via user_id (UNIQUE).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  responsible_name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) na tabela companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar sua própria empresa" ON public.companies;
DROP POLICY IF EXISTS "Usuários autenticados podem cadastrar sua própria empresa" ON public.companies;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar sua própria empresa" ON public.companies;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir sua própria empresa" ON public.companies;

-- Políticas de RLS para companies:
-- 1.1 SELECT: Usuário autenticado pode ler apenas a empresa cujo user_id corresponde ao seu auth.uid()
CREATE POLICY "Usuários autenticados podem visualizar sua própria empresa"
ON public.companies
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 1.2 INSERT: Usuário autenticado pode inserir empresa apenas com seu próprio user_id
CREATE POLICY "Usuários autenticados podem cadastrar sua própria empresa"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 1.3 UPDATE: Usuário autenticado pode atualizar apenas sua própria empresa
CREATE POLICY "Usuários autenticados podem atualizar sua própria empresa"
ON public.companies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 1.4 DELETE: Usuário autenticado pode excluir apenas sua própria empresa
CREATE POLICY "Usuários autenticados podem excluir sua própria empresa"
ON public.companies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);


-- ============================================================================
-- 2. TABELA: public.products
-- Armazena o catálogo de produtos da empresa do usuário autenticado.
-- Relacionamento 1:N com auth.users (user_id) e public.companies (company_id).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  barcode TEXT,
  cost_price NUMERIC(12,2) DEFAULT 0 NOT NULL,
  sale_price NUMERIC(12,2) DEFAULT 0 NOT NULL,
  current_stock NUMERIC(12,2) DEFAULT 0 NOT NULL,
  min_stock NUMERIC(12,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) na tabela products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar seus próprios produtos" ON public.products;
DROP POLICY IF EXISTS "Usuários autenticados podem cadastrar seus próprios produtos" ON public.products;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seus próprios produtos" ON public.products;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir seus próprios produtos" ON public.products;

-- Políticas de RLS para products:
-- 2.1 SELECT: Usuário autenticado visualiza somente os produtos da sua empresa
CREATE POLICY "Usuários autenticados podem visualizar seus próprios produtos"
ON public.products
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2.2 INSERT: Usuário autenticado cadastra produtos associados ao seu auth.uid()
CREATE POLICY "Usuários autenticados podem cadastrar seus próprios produtos"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2.3 UPDATE: Usuário autenticado atualiza apenas seus próprios produtos
CREATE POLICY "Usuários autenticados podem atualizar seus próprios produtos"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2.4 DELETE: Usuário autenticado exclui apenas seus próprios produtos
CREATE POLICY "Usuários autenticados podem excluir seus próprios produtos"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);


-- ============================================================================
-- 3. TABELA: public.stock_movements
-- Armazena o histórico de entradas e saídas de estoque de cada produto.
-- Relacionamento com auth.users, public.companies e public.products.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  movement_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) na tabela stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar suas próprias movimentações" ON public.stock_movements;
DROP POLICY IF EXISTS "Usuários autenticados podem cadastrar suas próprias movimentações" ON public.stock_movements;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas próprias movimentações" ON public.stock_movements;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir suas próprias movimentações" ON public.stock_movements;

-- Políticas de RLS para stock_movements:
-- 3.1 SELECT: Usuário autenticado visualiza somente as movimentações da sua empresa
CREATE POLICY "Usuários autenticados podem visualizar suas próprias movimentações"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3.2 INSERT: Usuário autenticado cadastra movimentações associadas ao seu auth.uid()
CREATE POLICY "Usuários autenticados podem cadastrar suas próprias movimentações"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3.3 UPDATE: Usuário autenticado atualiza apenas suas próprias movimentações
CREATE POLICY "Usuários autenticados podem atualizar suas próprias movimentações"
ON public.stock_movements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3.4 DELETE: Usuário autenticado exclui apenas suas próprias movimentações
CREATE POLICY "Usuários autenticados podem excluir suas próprias movimentações"
ON public.stock_movements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);

-- ============================================================================
-- 4. TRIGGER & FUNCTION: Atualização automática de estoque
-- Aumenta estoque na 'entrada' e reduz estoque na 'saida' impedindo saldo negativo.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_stock_movement_update()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock NUMERIC(12,2);
BEGIN
  -- Obter o estoque atual do produto
  SELECT current_stock INTO v_current_stock
  FROM public.products
  WHERE id = NEW.product_id AND user_id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado para atualização de estoque.';
  END IF;

  IF (NEW.type = 'entrada') THEN
    UPDATE public.products
    SET current_stock = current_stock + NEW.quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.product_id AND user_id = NEW.user_id;
  ELSIF (NEW.type = 'saida') THEN
    -- Validação de estoque negativo
    IF (v_current_stock < NEW.quantity) THEN
      RAISE EXCEPTION 'Estoque insuficiente. Estoque atual: %, Quantidade solicitada: %', v_current_stock, NEW.quantity;
    END IF;

    UPDATE public.products
    SET current_stock = current_stock - NEW.quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.product_id AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_after_stock_movement_insert ON public.stock_movements;
CREATE TRIGGER tr_after_stock_movement_insert
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.handle_stock_movement_update();


-- ============================================================================
-- 5. TABELA: public.company_members (Sistema de Papéis & Permissões - RBAC)
-- Armazena os usuários vinculados à empresa e seus papéis de acesso:
-- 'owner' (Proprietário) ou 'employee' (Funcionário).
-- Preparado para suportar 'manager' e 'ant_admin' em fases futuras.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'employee', 'manager', 'ant_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  invited_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Membros autenticados podem visualizar membros da mesma empresa" ON public.company_members;
DROP POLICY IF EXISTS "Proprietários podem cadastrar membros na empresa" ON public.company_members;
DROP POLICY IF EXISTS "Proprietários podem atualizar membros na empresa" ON public.company_members;
DROP POLICY IF EXISTS "Proprietários podem remover membros da empresa" ON public.company_members;

-- 5.1 SELECT: Usuários autenticados podem visualizar membros da empresa
CREATE POLICY "Membros autenticados podem visualizar membros da mesma empresa"
ON public.company_members
FOR SELECT
TO authenticated
USING (true);

-- 5.2 INSERT: Usuários autenticados podem convidar novos membros
CREATE POLICY "Proprietários podem cadastrar membros na empresa"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5.3 UPDATE: Usuários autenticados podem atualizar membros
CREATE POLICY "Proprietários podem atualizar membros na empresa"
ON public.company_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5.4 DELETE: Usuários autenticados podem remover membros
CREATE POLICY "Proprietários podem remover membros da empresa"
ON public.company_members
FOR DELETE
TO authenticated
USING (true);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON public.company_members(email);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON public.company_members(role);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);

