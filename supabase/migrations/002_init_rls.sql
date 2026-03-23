-- 002_init_rls.sql

-- Função helper: extrai o tenant_id da sessão PostgreSQL atual.
-- O NestJS injeta esse valor via: SELECT set_config('app.tenant_id', $1, true)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Habilitar RLS nas tabelas
ALTER TABLE public.tenants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Políticas: cada tenant vê apenas seus próprios dados
CREATE POLICY "tenants_isolation"
  ON public.tenants FOR ALL
  USING (id = current_tenant_id());

CREATE POLICY "tenant_users_isolation"
  ON public.tenant_users FOR ALL
  USING (tenant_id = current_tenant_id());

-- Forçar RLS mesmo para o role owner do banco
ALTER TABLE public.tenants      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users FORCE ROW LEVEL SECURITY;
