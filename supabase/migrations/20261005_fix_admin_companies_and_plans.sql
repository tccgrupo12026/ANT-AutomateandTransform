-- ==============================================================================
-- ANT — Automate and Transform
-- Migração: Correção de RLS para Dashboard Admin ANT & Tabela de Planos da Plataforma
-- ==============================================================================

-- 1. CORREÇÃO DE RLS NA TABELA 'companies'
-- Permite que usuários autenticados possam consultar a lista de empresas para o Dashboard Admin ANT.
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar sua própria empresa" ON public.companies;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar empresas" ON public.companies;
CREATE POLICY "Usuários autenticados podem visualizar empresas"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. CORREÇÃO DE RLS NA TABELA 'subscriptions'
-- Permite que o Dashboard Admin ANT visualize as assinaturas e trials de todas as empresas da plataforma.
DROP POLICY IF EXISTS "Usuários autenticados podem ver sua própria assinatura" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários autenticados podem ver assinaturas" ON public.subscriptions;
CREATE POLICY "Usuários autenticados podem ver assinaturas"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. CRIAÇÃO DA TABELA DE PLANOS DA PLATAFORMA (public.platform_plans)
-- Persiste as configurações, preços, limites e benefícios dos planos editados pelo Admin ANT.
CREATE TABLE IF NOT EXISTS public.platform_plans (
  id TEXT PRIMARY KEY CHECK (id IN ('starter', 'business', 'enterprise')),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 2,
  max_products INTEGER NOT NULL DEFAULT 200,
  badge TEXT,
  is_popular BOOLEAN DEFAULT false,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS em platform_plans
ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;

-- Leitura pública para que a Landing Page e visitantes possam consultar os planos e preços reais
DROP POLICY IF EXISTS "Qualquer pessoa pode visualizar os planos da plataforma" ON public.platform_plans;
CREATE POLICY "Qualquer pessoa pode visualizar os planos da plataforma"
  ON public.platform_plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Edição restrita a usuários autenticados (Admin ANT)
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar planos da plataforma" ON public.platform_plans;
CREATE POLICY "Usuários autenticados podem gerenciar planos da plataforma"
  ON public.platform_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserção dos registros padrão dos planos caso ainda não existam
INSERT INTO public.platform_plans (id, name, description, price_monthly, max_users, max_products, badge, is_popular, features)
VALUES
  (
    'starter',
    'Starter',
    'Ideal para autônomos e pequenos negócios iniciando a organização.',
    29.90,
    2,
    200,
    'Básico',
    false,
    '{"canManageStock": true, "canManageMovements": true, "canAccessPricing": true, "canAccessFinancial": false, "canAccessBusinessHealth": false, "canAccessCharts": true, "canAccessReports": true, "canManageUsers": false}'::jsonb
  ),
  (
    'business',
    'Business',
    'O plano completo para microempresas que buscam controle financeiro e crescimento.',
    59.90,
    5,
    2000,
    'Mais Escolhido',
    true,
    '{"canManageStock": true, "canManageMovements": true, "canAccessPricing": true, "canAccessFinancial": true, "canAccessBusinessHealth": true, "canAccessCharts": true, "canAccessReports": true, "canManageUsers": true}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    'Máxima potência, volume ilimitado e recursos avançados de gestão.',
    149.90,
    999,
    99999,
    'Ilimitado',
    false,
    '{"canManageStock": true, "canManageMovements": true, "canAccessPricing": true, "canAccessFinancial": true, "canAccessBusinessHealth": true, "canAccessCharts": true, "canAccessReports": true, "canManageUsers": true}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  updated_at = timezone('utc'::text, now());
