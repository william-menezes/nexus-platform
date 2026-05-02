-- 023_refactor_products.sql
-- Enriquece a tabela products com: type, lookups (category/brand/quality),
-- supplier_id, barcode, description, unit, is_active
-- Todos os campos novos têm DEFAULT ou são nullable para não quebrar dados existentes.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS type        TEXT NOT NULL DEFAULT 'product'
                                       CHECK (type IN ('product','part')),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id),
  ADD COLUMN IF NOT EXISTS brand_id    UUID REFERENCES item_brands(id),
  ADD COLUMN IF NOT EXISTS quality_id  UUID REFERENCES item_qualities(id),
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id),
  ADD COLUMN IF NOT EXISTS barcode     TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS unit        TEXT NOT NULL DEFAULT 'un',
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE;

-- Índices para filtros frequentes
CREATE INDEX IF NOT EXISTS idx_products_type
  ON products(tenant_id, type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_barcode
  ON products(tenant_id, barcode) WHERE barcode IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(tenant_id, category_id) WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_active
  ON products(tenant_id, is_active) WHERE deleted_at IS NULL;
