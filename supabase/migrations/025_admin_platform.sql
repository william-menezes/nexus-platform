-- 025_admin_platform.sql
-- Tabelas globais de plataforma: super_admins, plans, coupons
-- Sem tenant_id — entidades cross-tenant gerenciadas pelo SUPER_ADMIN

-- ----------------------------------------------------------------
-- super_admins
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- plans
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  modules     JSONB NOT NULL DEFAULT '[]',
  -- modules: array de strings, ex: ["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]
  limits      JSONB NOT NULL DEFAULT '{}',
  -- limits: ex: {"max_os": 100, "max_users": 3}  (null = ilimitado)
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- coupons
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,            -- armazenado em lowercase
  type        TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value       NUMERIC(10,2) NOT NULL,          -- % ou R$
  valid_until TIMESTAMPTZ,                     -- NULL = sem expiração
  max_uses    INTEGER,                         -- NULL = ilimitado
  uses_count  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Seed: planos padrão
-- ----------------------------------------------------------------
INSERT INTO public.plans (slug, name, price, modules, limits, sort_order) VALUES
(
  'trial',
  'Trial',
  0,
  '["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]',
  '{"max_os": 20, "max_users": 2}',
  0
),
(
  'starter',
  'Starter',
  49,
  '["clients","service_orders","sales","inventory","settings"]',
  '{"max_os": 100, "max_users": 3}',
  1
),
(
  'pro',
  'Pro',
  99,
  '["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]',
  '{"max_os": 1000, "max_users": 10}',
  2
),
(
  'enterprise',
  'Enterprise',
  199,
  '["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]',
  '{"max_os": null, "max_users": null}',
  3
)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------
-- Seed: contas SUPER_ADMIN
-- ----------------------------------------------------------------
INSERT INTO public.super_admins (user_id, name, email) VALUES
  ('1484209a-949d-4486-abab-e7dcff8d0f74', 'William',             'williamenezes@outlook.com'),
  ('9ccc9095-daaf-45f3-a6f1-5c2a58e2acdd', 'SimplificaOS Admin',  'simplificaos01@gmail.com')
ON CONFLICT (user_id) DO NOTHING;
