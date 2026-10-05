-- ==============================================================================
-- ANT — Automate and Transform
-- Migração: Sistema Avançado de Permissões e Cargos por Usuário
-- Tabela: public.company_members
-- ==============================================================================

-- 1. Garante a coluna job_title (Cargo / Função - texto livre)
ALTER TABLE public.company_members
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- 2. Garante a coluna permissions (JSONB com checkboxes de permissões granulares)
ALTER TABLE public.company_members
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 3. Atualiza índices para buscas eficientes
CREATE INDEX IF NOT EXISTS idx_company_members_job_title ON public.company_members(job_title);
CREATE INDEX IF NOT EXISTS idx_company_members_permissions ON public.company_members USING gin (permissions);

-- 4. Função auxiliar para mesclar permissões padrão se estiverem vazias
COMMENT ON COLUMN public.company_members.job_title IS 'Cargo ou função na empresa (ex: Gerente Financeiro, Vendedor, Estoquista)';
COMMENT ON COLUMN public.company_members.permissions IS 'Matriz granular de permissões por módulo e tela definidas pelo proprietário';
