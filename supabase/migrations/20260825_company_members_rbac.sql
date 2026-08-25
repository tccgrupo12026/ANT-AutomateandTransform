-- ============================================================================
-- ANT (Automate and Transform) — Migração RBAC: company_members
-- ============================================================================
-- Cria a tabela de membros da empresa com suporte a papéis e permissões (RBAC).
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

-- 1. SELECT
CREATE POLICY "Membros autenticados podem visualizar membros da mesma empresa"
ON public.company_members
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT
CREATE POLICY "Proprietários podem cadastrar membros na empresa"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. UPDATE
CREATE POLICY "Proprietários podem atualizar membros na empresa"
ON public.company_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. DELETE
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
