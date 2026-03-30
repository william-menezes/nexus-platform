CREATE TABLE public.service_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id),
  code            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','awaiting_parts','done','cancelled')),
  client_name     TEXT NOT NULL,
  client_phone    TEXT,
  description     TEXT NOT NULL,
  custom_fields   JSONB NOT NULL DEFAULT '{}',
  price_ideal     NUMERIC(10,2),
  price_effective NUMERIC(10,2),
  delivered_at    TIMESTAMPTZ,
  warranty_until  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.service_orders
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE INDEX idx_service_orders_tenant ON public.service_orders(tenant_id);
CREATE TRIGGER trg_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
