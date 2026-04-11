-- ============================================================
-- Migration 018: Pedidos de Compra
-- ============================================================

CREATE TABLE public.purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  code          TEXT NOT NULL,
  supplier_id   UUID NOT NULL REFERENCES suppliers(id),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','sent','partial','received','cancelled')),
  subtotal      NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  expected_at   DATE,
  received_at   TIMESTAMPTZ,
  nfe_number    TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(tenant_id, status);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.purchase_orders
  USING (tenant_id = current_tenant_id());

CREATE TABLE public.purchase_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity          NUMERIC(10,3) NOT NULL,
  unit_cost         NUMERIC(10,2) NOT NULL,
  total_cost        NUMERIC(10,2) NOT NULL,
  quantity_received NUMERIC(10,3) DEFAULT 0
);
CREATE INDEX idx_purchase_items_po ON purchase_items(purchase_order_id);

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.purchase_items
  USING (purchase_order_id IN (
    SELECT id FROM purchase_orders WHERE tenant_id = current_tenant_id()
  ));

CREATE TRIGGER set_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
