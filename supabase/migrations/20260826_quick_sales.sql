-- ==============================================================================
-- ANT — MÓDULO DE VENDA RÁPIDA (PDV / CÓDIGO DE BARRAS)
-- Migration: 20260826_quick_sales.sql
-- Criação da tabela de vendas com RLS e suporte a multi-tenancy e colaboradores
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  company_name TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_category TEXT,
  barcode TEXT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  payment_method TEXT NOT NULL DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outro')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  notes TEXT,
  sale_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de performance para relatórios e busca rápida no PDV
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_barcode ON public.sales(barcode);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Users can view sales of their company or self" ON public.sales;
CREATE POLICY "Users can view sales of their company or self"
  ON public.sales
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      UNION
      SELECT id::text FROM public.company_profile WHERE user_id = auth.uid()
      UNION
      SELECT auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert sales for their company" ON public.sales;
CREATE POLICY "Users can insert sales for their company"
  ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    company_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can update sales of their company" ON public.sales;
CREATE POLICY "Users can update sales of their company"
  ON public.sales
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      UNION
      SELECT auth.uid()::text
    )
  );

-- Fallback para acesso anônimo em ambiente de demonstração/teste local
DROP POLICY IF EXISTS "Anon sales access" ON public.sales;
CREATE POLICY "Anon sales access"
  ON public.sales
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
