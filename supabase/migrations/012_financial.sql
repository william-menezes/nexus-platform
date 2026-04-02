-- 012_financial.sql
-- Phase 2: chart_of_accounts, cost_centers, financial_entries, installments

-- ── Chart of Accounts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('revenue','cost','expense','asset','liability')),
  parent_id   UUID REFERENCES chart_of_accounts(id),
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant ON chart_of_accounts(tenant_id);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chart_accounts_isolation" ON public.chart_of_accounts;
CREATE POLICY "chart_accounts_isolation" ON public.chart_of_accounts FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── Cost Centers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON cost_centers(tenant_id);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cost_centers_isolation" ON public.cost_centers;
CREATE POLICY "cost_centers_isolation" ON public.cost_centers FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── Financial Entries ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  type              TEXT NOT NULL CHECK (type IN ('receivable','payable')),
  account_id        UUID REFERENCES chart_of_accounts(id),
  cost_center_id    UUID REFERENCES cost_centers(id),
  description       TEXT NOT NULL,
  total_amount      NUMERIC(10,2) NOT NULL,
  paid_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','partial','paid','overdue','cancelled')),
  due_date          DATE NOT NULL,
  paid_at           TIMESTAMPTZ,
  sale_id           UUID REFERENCES sales(id),
  contract_id       UUID,
  is_recurring      BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule   TEXT,
  parent_entry_id   UUID REFERENCES financial_entries(id),
  entity_type       TEXT CHECK (entity_type IN ('client','supplier','other')),
  entity_id         UUID,
  entity_name       TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fin_entries_tenant ON financial_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_entries_type   ON financial_entries(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_fin_entries_status ON financial_entries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fin_entries_due    ON financial_entries(tenant_id, due_date);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "financial_entries_isolation" ON public.financial_entries;
CREATE POLICY "financial_entries_isolation" ON public.financial_entries FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_financial_entries_updated_at ON public.financial_entries;
CREATE TRIGGER trg_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Installments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.installments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  financial_entry_id   UUID NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
  installment_number   INTEGER NOT NULL,
  amount               NUMERIC(10,2) NOT NULL,
  due_date             DATE NOT NULL,
  paid_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_at              TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','paid','overdue','cancelled')),
  payment_method       TEXT CHECK (payment_method IN ('cash','credit','debit','pix','boleto','transfer')),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_installments_entry ON installments(financial_entry_id);
CREATE INDEX IF NOT EXISTS idx_installments_due   ON installments(tenant_id, due_date, status);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "installments_isolation" ON public.installments;
CREATE POLICY "installments_isolation" ON public.installments FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_installments_updated_at ON public.installments;
CREATE TRIGGER trg_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
