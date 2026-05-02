-- Create standalone addresses table
CREATE TABLE public.addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  zip_code      TEXT,
  street        TEXT,
  number        TEXT,
  complement    TEXT,
  neighborhood  TEXT,
  city          TEXT,
  state         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_tenant ON addresses(tenant_id);

-- Migrate existing clients: drop JSONB column and add FK
ALTER TABLE public.clients
  DROP COLUMN IF EXISTS address,
  ADD COLUMN address_id UUID REFERENCES addresses(id) ON DELETE SET NULL;
