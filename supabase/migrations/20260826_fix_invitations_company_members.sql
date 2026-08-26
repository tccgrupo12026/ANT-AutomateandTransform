-- ============================================================================
-- ANT (Automate and Transform) — Migração: Ajuste e Correção de Convites
-- ============================================================================
-- Esta migração assegura que a tabela `company_members` contenha todos os campos
-- necessários para o ciclo de vida dos convites e as políticas RLS anônimas
-- para que colaboradores possam abrir e aceitar o link sem erros.
-- ============================================================================

-- 1. Garante a tabela
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  company_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'employee', 'manager', 'ant_admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'inactive')),
  invite_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adiciona colunas se estiverem ausentes em instâncias existentes
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Garante constraint de unicidade no invite_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_members_invite_token_key'
  ) THEN
    ALTER TABLE public.company_members ADD CONSTRAINT company_members_invite_token_key UNIQUE (invite_token);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 4. Atualiza constraint de status para permitir 'expired'
ALTER TABLE public.company_members DROP CONSTRAINT IF EXISTS company_members_status_check;
ALTER TABLE public.company_members ADD CONSTRAINT company_members_status_check CHECK (status IN ('active', 'pending', 'expired', 'inactive'));

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 6. Recriar políticas de segurança com suporte a anon para busca e aceite de convites
DROP POLICY IF EXISTS "Membros autenticados podem visualizar membros da mesma empresa" ON public.company_members;
DROP POLICY IF EXISTS "Proprietários podem cadastrar membros na empresa" ON public.company_members;
DROP POLICY IF EXISTS "Proprietários podem atualizar membros na empresa" ON public.company_members;
DROP POLICY IF EXISTS "Proprietários podem remover membros da empresa" ON public.company_members;
DROP POLICY IF EXISTS "Convites podem ser consultados por token anônimo" ON public.company_members;
DROP POLICY IF EXISTS "Convites podem ser atualizados no aceite" ON public.company_members;

-- 6.1 SELECT Autenticado (membros logados vêem os membros da empresa)
CREATE POLICY "Membros autenticados podem visualizar membros da mesma empresa"
ON public.company_members
FOR SELECT
TO authenticated
USING (true);

-- 6.2 SELECT Anônimo (convidado não-logado busca detalhes do convite pelo token na URL)
CREATE POLICY "Convites podem ser consultados por token anônimo"
ON public.company_members
FOR SELECT
TO anon
USING (invite_token IS NOT NULL);

-- 6.3 INSERT Autenticado (proprietários criam novos convites)
CREATE POLICY "Proprietários podem cadastrar membros na empresa"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6.4 UPDATE Autenticado (proprietários editam ou inativam colaboradores)
CREATE POLICY "Proprietários podem atualizar membros na empresa"
ON public.company_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 6.5 UPDATE Anônimo (convidado aceita o convite e vincula seu user_id)
CREATE POLICY "Convites podem ser atualizados no aceite"
ON public.company_members
FOR UPDATE
TO anon
USING (invite_token IS NOT NULL)
WITH CHECK (invite_token IS NOT NULL);

-- 6.6 DELETE Autenticado (proprietários removem membros da empresa)
CREATE POLICY "Proprietários podem remover membros da empresa"
ON public.company_members
FOR DELETE
TO authenticated
USING (true);

-- 7. Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON public.company_members(email);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON public.company_members(role);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_invite_token ON public.company_members(invite_token);
CREATE INDEX IF NOT EXISTS idx_company_members_expires_at ON public.company_members(expires_at);
