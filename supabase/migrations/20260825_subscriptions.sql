-- ==============================================================================
-- ANT — Automate and Transform
-- Migração Supabase: Tabela de Assinaturas e Planos SaaS (Trial de 30 dias)
-- ==============================================================================

-- 1. Criação da Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL DEFAULT 'starter' CHECK (plan_id IN ('starter', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'suspended')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices para Otimização de Busca
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3. Habilitação de Segurança a Nível de Linha (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso RLS
DROP POLICY IF EXISTS "Usuários autenticados podem ver sua própria assinatura" ON public.subscriptions;
CREATE POLICY "Usuários autenticados podem ver sua própria assinatura"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir sua própria assinatura" ON public.subscriptions;
CREATE POLICY "Usuários autenticados podem inserir sua própria assinatura"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar sua própria assinatura" ON public.subscriptions;
CREATE POLICY "Usuários autenticados podem atualizar sua própria assinatura"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Trigger para Atualizar o Timestamp `updated_at` Automaticamente
CREATE OR REPLACE FUNCTION public.handle_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_updated_at();

-- 6. Trigger Opcional: Criar Assinatura Trial de 30 Dias Automaticamente no Novo Cadastro de Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    start_date,
    trial_end_date,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    'starter',
    'trial',
    'monthly',
    now(),
    now() + INTERVAL '30 days',
    now(),
    now() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_trial_subscription();
