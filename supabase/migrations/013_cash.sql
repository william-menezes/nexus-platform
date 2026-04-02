-- 013_cash.sql
-- Phase 2: cash_registers, cash_sessions, cash_movements

-- ── Cash Registers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL DEFAULT 'Caixa Principal',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_registers_tenant ON cash_registers(tenant_id);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cash_registers_isolation" ON public.cash_registers;
CREATE POLICY "cash_registers_isolation" ON public.cash_registers FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── Cash Sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  opened_by        UUID NOT NULL,
  closed_by        UUID,
  opening_amount   NUMERIC(10,2) NOT NULL,
  closing_amount   NUMERIC(10,2),
  expected_amount  NUMERIC(10,2),
  difference       NUMERIC(10,2),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at        TIMESTAMPTZ,
  notes            TEXT
);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant   ON cash_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_register ON cash_sessions(cash_register_id);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cash_sessions_isolation" ON public.cash_sessions;
CREATE POLICY "cash_sessions_isolation" ON public.cash_sessions FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── Cash Movements ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  type            TEXT NOT NULL CHECK (type IN ('sale','receipt','withdrawal','expense','adjustment')),
  amount          NUMERIC(10,2) NOT NULL,
  description     TEXT NOT NULL,
  sale_id         UUID REFERENCES sales(id),
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cash_movements_isolation" ON public.cash_movements;
CREATE POLICY "cash_movements_isolation" ON public.cash_movements FOR ALL
  USING (tenant_id = current_tenant_id());
