-- 024_refactor_services_add_category.sql
-- Tabela services já existe (migration 009).
-- Adiciona category_id referenciando item_categories com item_type='service'.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id);

CREATE INDEX IF NOT EXISTS idx_services_category
  ON services(tenant_id, category_id) WHERE category_id IS NOT NULL;
