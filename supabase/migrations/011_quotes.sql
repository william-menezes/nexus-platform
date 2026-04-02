-- 011_quotes.sql
-- Phase 2: quotes + quote_items

CREATE TABLE IF NOT EXISTS public.quotes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  code                  TEXT NOT NULL,
  client_id             UUID NOT NULL REFERENCES clients(id),
  status_id             UUID NOT NULL REFERENCES custom_statuses(id),
  employee_id           UUID REFERENCES employees(id),
  equipment_id          UUID REFERENCES equipments(id),
  description           TEXT,
  subtotal              NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until           DATE,
  sent_at               TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  converted_to_os_id    UUID,
  notes                 TEXT,
  custom_fields         JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(tenant_id, status_id);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotes_isolation" ON public.quotes;
CREATE POLICY "quotes_isolation" ON public.quotes FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_quotes_updated_at ON public.quotes;
CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Quote Items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','service')),
  product_id  UUID REFERENCES products(id),
  service_id  UUID REFERENCES services(id),
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  discount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
