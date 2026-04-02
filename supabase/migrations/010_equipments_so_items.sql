-- 010_equipments_so_items.sql
-- Phase 2: equipment_types, equipments, so_items, so_equipments

-- ── Equipment Types ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL,
  fields_schema JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_equipment_types_tenant ON equipment_types(tenant_id);

ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipment_types_isolation" ON public.equipment_types;
CREATE POLICY "equipment_types_isolation" ON public.equipment_types FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_equipment_types_updated_at ON public.equipment_types;
CREATE TRIGGER trg_equipment_types_updated_at
  BEFORE UPDATE ON public.equipment_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Equipments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.equipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  equipment_type_id UUID NOT NULL REFERENCES equipment_types(id),
  client_id         UUID REFERENCES clients(id),
  brand             TEXT,
  model             TEXT,
  fields_data       JSONB NOT NULL DEFAULT '{}',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_equipments_tenant ON equipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_equipments_client ON equipments(client_id);
CREATE INDEX IF NOT EXISTS idx_equipments_type   ON equipments(equipment_type_id);

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipments_isolation" ON public.equipments;
CREATE POLICY "equipments_isolation" ON public.equipments FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_equipments_updated_at ON public.equipments;
CREATE TRIGGER trg_equipments_updated_at
  BEFORE UPDATE ON public.equipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SO Items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.so_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  item_type        TEXT NOT NULL CHECK (item_type IN ('product','service')),
  product_id       UUID REFERENCES products(id),
  service_id       UUID REFERENCES services(id),
  description      TEXT NOT NULL,
  quantity         NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price       NUMERIC(10,2) NOT NULL,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price      NUMERIC(10,2) NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_so_items_so ON so_items(service_order_id);

-- ── SO Equipments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.so_equipments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  equipment_id     UUID NOT NULL REFERENCES equipments(id),
  checklist_data   JSONB DEFAULT '[]',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_so_equipments_so ON so_equipments(service_order_id);
