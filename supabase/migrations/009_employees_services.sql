-- 009_employees_services.sql
-- Phase 2: employees + services catalog

-- ── Employees ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID REFERENCES auth.users(id),
  name            TEXT NOT NULL,
  role_label      TEXT,
  phone           TEXT,
  email           TEXT,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_isolation" ON public.employees;
CREATE POLICY "employees_isolation" ON public.employees FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Services (catalog) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  description     TEXT,
  default_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(5,2),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_isolation" ON public.services;
CREATE POLICY "services_isolation" ON public.services FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
