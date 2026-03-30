-- 007_phase1_foundation.sql
-- Phase 1: Foundation tables (clients, custom_statuses, tenant_settings, audit_logs, permissions)
-- Also patches tenants table with new columns (cnpj, phone, segment, logo_url, trial_ends_at)

-- ── Patch tenants ───────────────────────────────────────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cnpj          TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS segment       TEXT DEFAULT 'generic'
    CHECK (segment IN ('electronics','hvac','it','automotive','generic')),
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ── Patch tenant_users: expand role enum ────────────────────
-- Old roles: owner, admin, operator, viewer
-- New roles: SUPER_ADMIN, TENANT_ADMIN, TECNICO, VENDEDOR (+ keep old for migration)
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_role_check
  CHECK (role IN ('owner','admin','operator','viewer','SUPER_ADMIN','TENANT_ADMIN','TECNICO','VENDEDOR'));

-- Migrate old roles to new roles
UPDATE public.tenant_users SET role = 'TENANT_ADMIN' WHERE role = 'owner';
UPDATE public.tenant_users SET role = 'TENANT_ADMIN' WHERE role = 'admin';
UPDATE public.tenant_users SET role = 'TECNICO'      WHERE role = 'operator';
UPDATE public.tenant_users SET role = 'TECNICO'      WHERE role = 'viewer';

-- Tighten constraint to new roles only
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_role_check
  CHECK (role IN ('SUPER_ADMIN','TENANT_ADMIN','TECNICO','VENDEDOR'));

-- ── Clients ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'individual'
              CHECK (type IN ('individual','company')),
  cpf_cnpj    TEXT,
  email       TEXT,
  phone       TEXT,
  phone2      TEXT,
  address     JSONB DEFAULT '{}',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf    ON clients(tenant_id, cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_name   ON clients(tenant_id, name);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
CREATE POLICY "clients_isolation" ON public.clients FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Custom Statuses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service_order','sale','quote')),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6B7280',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  is_final    BOOLEAN NOT NULL DEFAULT FALSE,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_custom_statuses_tenant ON custom_statuses(tenant_id, entity_type);

ALTER TABLE public.custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_statuses FORCE ROW LEVEL SECURITY;
CREATE POLICY "custom_statuses_isolation" ON public.custom_statuses FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── Tenant Settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID UNIQUE NOT NULL REFERENCES tenants(id),
  quote_validity_days  INTEGER NOT NULL DEFAULT 30,
  warranty_days        INTEGER NOT NULL DEFAULT 90,
  currency             TEXT NOT NULL DEFAULT 'BRL',
  timezone             TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  os_code_prefix       TEXT NOT NULL DEFAULT 'OS',
  quote_code_prefix    TEXT NOT NULL DEFAULT 'ORC',
  sale_code_prefix     TEXT NOT NULL DEFAULT 'VND',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_settings_isolation" ON public.tenant_settings FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE TRIGGER trg_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Audit Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID NOT NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(tenant_id, entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user   ON audit_logs(tenant_id, user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_isolation" ON public.audit_logs FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── Permissions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  role       TEXT NOT NULL,
  module     TEXT NOT NULL,
  actions    TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, role, module)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;
CREATE POLICY "permissions_isolation" ON public.permissions FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
