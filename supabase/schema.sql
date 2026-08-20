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
