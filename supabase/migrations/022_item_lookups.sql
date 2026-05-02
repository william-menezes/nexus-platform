-- 022_item_lookups.sql
-- Tabelas de lookup para catálogo: categorias, marcas e qualidades
-- Cada tabela usa item_type como discriminador para manter listas independentes
-- por tipo de item (product, part, service)

-- ── item_categories ──────────────────────────────────────────
-- item_type='product' → categorias de produto (independente de peças)
-- item_type='part'    → categorias de peça    (independente de produtos)
-- item_type='service' → categorias de serviço
CREATE TABLE IF NOT EXISTS public.item_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','part','service')),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, item_type, name)
);
CREATE INDEX IF NOT EXISTS idx_item_categories_tenant
  ON item_categories(tenant_id, item_type) WHERE deleted_at IS NULL;

ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "item_categories_isolation" ON public.item_categories;
CREATE POLICY "item_categories_isolation" ON public.item_categories FOR ALL
  USING (tenant_id = current_tenant_id());

DROP TRIGGER IF EXISTS trg_item_categories_updated_at ON public.item_categories;
CREATE TRIGGER trg_item_categories_updated_at
  BEFORE UPDATE ON public.item_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── item_brands ───────────────────────────────────────────────
-- item_type='product' → marcas de produto (independente de peças)
-- item_type='part'    → marcas de peça    (independente de produtos)
CREATE TABLE IF NOT EXISTS public.item_brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','part')),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, item_type, name)
);
CREATE INDEX IF NOT EXISTS idx_item_brands_tenant
  ON item_brands(tenant_id, item_type) WHERE deleted_at IS NULL;

ALTER TABLE public.item_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_brands FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "item_brands_isolation" ON public.item_brands;
CREATE POLICY "item_brands_isolation" ON public.item_brands FOR ALL
  USING (tenant_id = current_tenant_id());

-- ── item_qualities ────────────────────────────────────────────
-- item_type='product' → qualidades de produto (independente de peças)
-- item_type='part'    → qualidades de peça    (independente de produtos)
-- level: ordena o select (1=melhor qualidade, ex: Original; 99=genérico)
CREATE TABLE IF NOT EXISTS public.item_qualities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','part')),
  name        TEXT NOT NULL,
  level       INTEGER NOT NULL DEFAULT 99,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, item_type, name)
);
CREATE INDEX IF NOT EXISTS idx_item_qualities_tenant
  ON item_qualities(tenant_id, item_type) WHERE deleted_at IS NULL;

ALTER TABLE public.item_qualities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_qualities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "item_qualities_isolation" ON public.item_qualities;
CREATE POLICY "item_qualities_isolation" ON public.item_qualities FOR ALL
  USING (tenant_id = current_tenant_id());
