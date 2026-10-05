-- ==============================================================================
-- ANT — Automate and Transform
-- Migração: Sistema Avançado de Permissões Granulares e Cargos de Colaboradores
-- ==============================================================================

-- 1. Adicionar colunas 'job_title' (Cargo/Função) e 'permissions' (JSONB) na tabela company_members
ALTER TABLE public.company_members 
ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE public.company_members 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 2. Índice para consultas rápidas de cargo
CREATE INDEX IF NOT EXISTS idx_company_members_job_title ON public.company_members(job_title);
