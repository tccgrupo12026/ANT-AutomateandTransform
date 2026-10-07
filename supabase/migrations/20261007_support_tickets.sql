-- ==============================================================================
-- ANT — SISTEMA DE SUPORTE AO CLIENTE & INTEGRAÇÃO COM ADMIN ANT
-- Migration: 20261007_support_tickets.sql
-- 100% Compatível com o schema real do projeto:
-- - public.companies
-- - public.company_members
-- - public.subscriptions
-- - auth.users
-- ==============================================================================

-- 1. Habilitar extensões necessárias para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Sequência para numeração legível e incremental de chamados (ex: TCK-1001)
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START WITH 1001;

-- 3. Tabela principal de chamados
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT,
  created_by_role TEXT NOT NULL DEFAULT 'owner',
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Problema Técnico',
    'Erro no Sistema',
    'Financeiro',
    'Assinaturas',
    'Dúvida',
    'Sugestão',
    'Outro'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN (
    'Aberto',
    'Em Análise',
    'Respondido',
    'Resolvido',
    'Fechado'
  )),
  has_unread_client_response BOOLEAN NOT NULL DEFAULT FALSE,
  has_unread_admin_response BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Garantir índice único para o número do chamado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_ticket_number_key'
  ) THEN
    ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 4. Função e trigger para gerar automaticamente o ticket_number caso não informado
CREATE OR REPLACE FUNCTION public.fn_generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'TCK-' || nextval('public.support_ticket_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_ticket_number ON public.support_tickets;
CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.fn_generate_ticket_number();

-- 5. Tabela de mensagens e interações de suporte
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  sender_user_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON public.support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at ASC);

-- 7. Habilitar Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- 8. Limpar políticas anteriores para evitar duplicidade ou conflitos
DROP POLICY IF EXISTS "support_tickets_select_policy" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_policy" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_update_policy" ON public.support_tickets;
DROP POLICY IF EXISTS "Companies and members view own tickets, admin views all" ON public.support_tickets;
DROP POLICY IF EXISTS "Members can create tickets for their company" ON public.support_tickets;
DROP POLICY IF EXISTS "Members or Admin can update their tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Empresas visualizam chamados próprios, Admin ANT visualiza todos" ON public.support_tickets;
DROP POLICY IF EXISTS "Membros criam chamados para sua empresa" ON public.support_tickets;

-- 9. Políticas de RLS para support_tickets (Utilizando apenas companies, company_members e auth.users)
CREATE POLICY "support_tickets_select_policy"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    -- Admin ANT tem visibilidade global
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    -- Usuário que abriu o chamado
    created_by_user_id = auth.uid()::text OR
    -- Membro ou proprietário da empresa correspondente (companies / company_members)
    company_id = auth.uid()::text OR
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      UNION
      SELECT id::text FROM public.companies WHERE user_id = auth.uid()
      UNION
      SELECT user_id::text FROM public.companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "support_tickets_insert_policy"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()::text OR
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin'
  );

CREATE POLICY "support_tickets_update_policy"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    created_by_user_id = auth.uid()::text OR
    company_id = auth.uid()::text OR
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      UNION
      SELECT id::text FROM public.companies WHERE user_id = auth.uid()
      UNION
      SELECT user_id::text FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- 10. Políticas de RLS para support_ticket_messages
DROP POLICY IF EXISTS "support_ticket_messages_select_policy" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "support_ticket_messages_insert_policy" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "View ticket messages if can view ticket" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Insert messages if related to ticket" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Mensagens visíveis para membros autorizados" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Inserção de mensagens" ON public.support_ticket_messages;

CREATE POLICY "support_ticket_messages_select_policy"
  ON public.support_ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin' OR
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE created_by_user_id = auth.uid()::text OR
      company_id = auth.uid()::text OR
      company_id IN (
        SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
        UNION
        SELECT id::text FROM public.companies WHERE user_id = auth.uid()
        UNION
        SELECT user_id::text FROM public.companies WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "support_ticket_messages_insert_policy"
  ON public.support_ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()::text OR
    (auth.jwt() ->> 'email') = 'tccgrupo12026@gmail.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ant_admin'
  );
