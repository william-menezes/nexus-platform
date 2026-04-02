-- 008_refactor_os_sales.sql
-- Phase 1 Task 1.4 & 1.5: Add client_id, status_id, employee_id to service_orders and sales
-- Old string-based columns (status, client_name, client_phone) are kept for backward compatibility

-- ── service_orders ───────────────────────────────────────────

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS client_id   UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS status_id   UUID REFERENCES public.custom_statuses(id),
  ADD COLUMN IF NOT EXISTS employee_id UUID;

CREATE INDEX IF NOT EXISTS idx_so_client   ON public.service_orders(tenant_id, client_id)  WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_so_status   ON public.service_orders(tenant_id, status_id)  WHERE status_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_so_employee ON public.service_orders(tenant_id, employee_id) WHERE employee_id IS NOT NULL;

-- ── sales ────────────────────────────────────────────────────

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS client_id   UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS status_id   UUID REFERENCES public.custom_statuses(id),
  ADD COLUMN IF NOT EXISTS employee_id UUID,
  ADD COLUMN IF NOT EXISTS code        TEXT,
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sales_client   ON public.sales(tenant_id, client_id)  WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_status   ON public.sales(tenant_id, status_id)  WHERE status_id IS NOT NULL;
