-- ============================================================
-- Migration 017: Trocas e Devoluções
-- ============================================================

CREATE TABLE public.returns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  sale_id       UUID NOT NULL REFERENCES sales(id),
  code          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('refund','credit','exchange')),
  reason        TEXT NOT NULL,
  total_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(10,2) DEFAULT 0,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','completed','rejected')),
  processed_by  UUID,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_returns_tenant ON returns(tenant_id);
CREATE INDEX idx_returns_sale   ON returns(sale_id);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.returns
  USING (tenant_id = current_tenant_id());

CREATE TABLE public.return_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id           UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id        UUID NOT NULL REFERENCES sale_items(id),
  product_id          UUID REFERENCES products(id),
  quantity            INTEGER NOT NULL,
  unit_price          NUMERIC(10,2) NOT NULL,
  total_price         NUMERIC(10,2) NOT NULL,
  exchange_product_id UUID REFERENCES products(id),
  exchange_quantity   INTEGER,
  exchange_unit_price NUMERIC(10,2),
  exchange_total      NUMERIC(10,2),
  stock_returned      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_return_items_return ON return_items(return_id);

ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.return_items
  USING (return_id IN (
    SELECT id FROM returns WHERE tenant_id = current_tenant_id()
  ));

CREATE TRIGGER set_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
