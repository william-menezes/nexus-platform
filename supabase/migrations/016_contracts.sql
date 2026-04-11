-- ============================================================
-- Migration 016: Contratos de Serviço
-- ============================================================

CREATE TABLE public.contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  code              TEXT NOT NULL,
  client_id         UUID NOT NULL REFERENCES clients(id),
  type              TEXT NOT NULL CHECK (type IN ('fixed','hourly_franchise')),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','suspended','cancelled','expired')),
  description       TEXT,
  monthly_value     NUMERIC(10,2),
  franchise_hours   NUMERIC(6,2),
  hour_excess_price NUMERIC(10,2),
  start_date        DATE NOT NULL,
  end_date          DATE,
  billing_day       INTEGER DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  adjustment_rate   NUMERIC(5,2) DEFAULT 0,
  last_adjustment   DATE,
  next_billing_at   TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(tenant_id, status);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.contracts
  USING (tenant_id = current_tenant_id());

-- Faturamento de contratos
CREATE TABLE public.contract_billing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  contract_id     UUID NOT NULL REFERENCES contracts(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  base_amount     NUMERIC(10,2) NOT NULL,
  excess_hours    NUMERIC(6,2) DEFAULT 0,
  excess_amount   NUMERIC(10,2) DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','billed','paid','cancelled')),
  billed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contract_billing_contract ON contract_billing(contract_id);

ALTER TABLE public.contract_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.contract_billing
  USING (tenant_id = current_tenant_id());

CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
