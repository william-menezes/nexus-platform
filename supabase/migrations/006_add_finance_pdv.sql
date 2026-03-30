-- ============================================================
-- Migration 006 — Módulo Financeiro / PDV
-- ============================================================

-- Vendas (PDV)
CREATE TABLE public.sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id),
  service_order_id UUID REFERENCES public.service_orders(id),  -- venda vinculada a uma OS
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'paid', 'cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.sales
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Itens da venda (produto ou linha de serviço/mão-de-obra)
CREATE TABLE public.sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id),  -- NULL = linha de serviço
  description TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
-- RLS via join com sales (tenant_id está em sales)
CREATE POLICY "tenant_isolation" ON public.sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND s.tenant_id = current_tenant_id()
    )
  );
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);

-- Pagamentos (multi-payment por venda)
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  method          TEXT NOT NULL CHECK (method IN ('cash', 'credit', 'debit', 'pix', 'boleto')),
  amount          NUMERIC(10,2) NOT NULL,
  asaas_charge_id TEXT,  -- preenchido quando method = 'boleto'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = payments.sale_id
        AND s.tenant_id = current_tenant_id()
    )
  );
CREATE INDEX idx_payments_sale ON public.payments(sale_id);

-- Trigger: ao fechar venda (status → paid), baixa estoque de cada item com produto
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executa quando muda de outro status para 'paid'
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    INSERT INTO public.stock_entries (tenant_id, product_id, type, quantity, observation)
    SELECT
      NEW.tenant_id,
      si.product_id,
      'out',
      si.quantity,
      'Venda ' || NEW.id::text
    FROM public.sale_items si
    WHERE si.sale_id = NEW.id
      AND si.product_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deduct_stock_on_sale
  AFTER UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_sale();
