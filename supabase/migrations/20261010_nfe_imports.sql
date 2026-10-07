-- ==============================================================================
-- ANT — FASE 4: IMPORTAÇÃO DE NF-E (ACADÊMICO / TCC)
-- Migration: 20261010_nfe_imports.sql
-- ==============================================================================

-- 1. Tabela de Cabeçalho de Importação de NF-e
CREATE TABLE IF NOT EXISTS public.nfe_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  imported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_by_user_name TEXT,
  access_key VARCHAR(44) NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_cnpj TEXT,
  number TEXT NOT NULL,
  series TEXT NOT NULL DEFAULT '001',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  items_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Itens da NF-e Importada
CREATE TABLE IF NOT EXISTS public.nfe_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_import_id UUID REFERENCES public.nfe_imports(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  unit TEXT DEFAULT 'UN',
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_nfe_imports_company_id ON public.nfe_imports(company_id);
CREATE INDEX IF NOT EXISTS idx_nfe_imports_access_key ON public.nfe_imports(access_key);
CREATE INDEX IF NOT EXISTS idx_nfe_imports_created_at ON public.nfe_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfe_import_items_import_id ON public.nfe_import_items(nfe_import_id);
CREATE INDEX IF NOT EXISTS idx_nfe_import_items_company_id ON public.nfe_import_items(company_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.nfe_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_import_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nfe_imports_select_policy" ON public.nfe_imports;
DROP POLICY IF EXISTS "nfe_imports_insert_policy" ON public.nfe_imports;
DROP POLICY IF EXISTS "nfe_import_items_select_policy" ON public.nfe_import_items;
DROP POLICY IF EXISTS "nfe_import_items_insert_policy" ON public.nfe_import_items;

CREATE POLICY "nfe_imports_select_policy"
  ON public.nfe_imports
  FOR SELECT
  TO authenticated
  USING (
    imported_by_user_id = auth.uid() OR
    company_id = auth.uid()::text OR
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ant_admin' OR
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      UNION
      SELECT id::text FROM public.companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "nfe_imports_insert_policy"
  ON public.nfe_imports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "nfe_import_items_select_policy"
  ON public.nfe_import_items
  FOR SELECT
  TO authenticated
  USING (
    company_id = auth.uid()::text OR
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ant_admin' OR
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      UNION
      SELECT id::text FROM public.companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "nfe_import_items_insert_policy"
  ON public.nfe_import_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
