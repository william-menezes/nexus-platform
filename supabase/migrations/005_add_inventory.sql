-- ============================================================
-- Migration 005 — Módulo de Estoque (Inventory)
-- ============================================================

-- Produtos
CREATE TABLE public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id),
  name          TEXT NOT NULL,
  sku           TEXT,
  cost_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock     INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  category      TEXT,
  external_ref  TEXT,           -- referência NF-e (cProd do XML)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.products
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE UNIQUE INDEX idx_products_sku_tenant ON public.products(tenant_id, sku)
  WHERE sku IS NOT NULL AND deleted_at IS NULL;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Movimentações de estoque
CREATE TABLE public.stock_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id),
  product_id       UUID NOT NULL REFERENCES public.products(id),
  service_order_id UUID REFERENCES public.service_orders(id),  -- baixa via OS
  type             TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  nfe_number       TEXT,
  observation      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.stock_entries
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE INDEX idx_stock_entries_tenant  ON public.stock_entries(tenant_id);
CREATE INDEX idx_stock_entries_product ON public.stock_entries(product_id);

-- Trigger: atualiza current_stock em products após cada movimentação
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE public.products
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSE
    UPDATE public.products
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_product_stock
  AFTER INSERT ON public.stock_entries
  FOR EACH ROW EXECUTE FUNCTION update_product_stock();
