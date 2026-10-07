-- ==============================================================================
-- ANT — FASE 3: SISTEMA DE ASSINATURAS & INTEGRAÇÃO MERCADO PAGO
-- Migration: 20261008_phase3_subscriptions_mercadopago.sql
-- ==============================================================================

-- 1. Atualizar a tabela de assinaturas existente (public.subscriptions)
DO $$
BEGIN
  -- Atualizar constraint de status da assinatura para os 7 estados oficiais
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;
  END IF;

  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('trial', 'active', 'pending_payment', 'overdue', 'suspended', 'expired', 'canceled'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Adicionar colunas comerciais da Fase 3 na tabela de assinaturas
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(10,2);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_method TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_customer_id TEXT;

-- 2. Tabela de Histórico de Cobranças e Pagamentos (public.subscription_payments)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  company_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'vencido', 'cancelado')),
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_status TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  pix_copy_paste TEXT,
  boleto_barcode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Logs e Auditoria de Webhooks Mercado Pago (public.mercadopago_webhooks_log)
CREATE TABLE IF NOT EXISTS public.mercadopago_webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  action TEXT,
  data_id TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Índices de Otimização e Performance
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_company_id ON public.subscription_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_created_at ON public.subscription_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_mp_id ON public.subscription_payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_webhooks_log ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS para subscription_payments
DROP POLICY IF EXISTS "subscription_payments_select_policy" ON public.subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_insert_policy" ON public.subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_update_policy" ON public.subscription_payments;

CREATE POLICY "subscription_payments_select_policy"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
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

CREATE POLICY "subscription_payments_insert_policy"
  ON public.subscription_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ant_admin'
  );

CREATE POLICY "subscription_payments_update_policy"
  ON public.subscription_payments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ant_admin'
  )
  WITH CHECK (true);

-- 7. Políticas de RLS para mercadopago_webhooks_log
DROP POLICY IF EXISTS "mercadopago_webhooks_admin_policy" ON public.mercadopago_webhooks_log;
DROP POLICY IF EXISTS "mercadopago_webhooks_insert_policy" ON public.mercadopago_webhooks_log;

CREATE POLICY "mercadopago_webhooks_insert_policy"
  ON public.mercadopago_webhooks_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "mercadopago_webhooks_admin_policy"
  ON public.mercadopago_webhooks_log
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ant_admin'
  );
