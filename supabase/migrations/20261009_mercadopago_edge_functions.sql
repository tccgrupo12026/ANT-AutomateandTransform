-- ==============================================================================
-- ANT — FASE 3: MERCADO PAGO EDGE FUNCTIONS & CAMPOS DE PAGAMENTO REAL
-- Migration: 20261009_mercadopago_edge_functions.sql
-- ==============================================================================

-- 1. Adicionar colunas de suporte a checkout real na tabela subscription_payments
ALTER TABLE public.subscription_payments 
  ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;

ALTER TABLE public.subscription_payments 
  ADD COLUMN IF NOT EXISTS boleto_url TEXT;

ALTER TABLE public.subscription_payments 
  ADD COLUMN IF NOT EXISTS init_point TEXT;

ALTER TABLE public.subscription_payments 
  ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- 2. Garantir índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_subscription_payments_mp_payment_id 
  ON public.subscription_payments(mp_payment_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_mp_preference_id 
  ON public.subscription_payments(mp_preference_id);

-- 3. Habilitar inserção/atualização para Edge Functions e Webhooks (service_role ou anon)
-- A Edge Function usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS,
-- mas garantimos que as políticas para usuários autenticados continuem seguras.
COMMENT ON COLUMN public.subscription_payments.qr_code_base64 IS 'Imagem PNG em base64 do QR Code gerada pelo Mercado Pago';
COMMENT ON COLUMN public.subscription_payments.boleto_url IS 'Link oficial do boleto bancário gerado pelo Mercado Pago';
COMMENT ON COLUMN public.subscription_payments.init_point IS 'Link do Checkout Pro Mercado Pago';
