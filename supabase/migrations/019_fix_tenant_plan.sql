-- 019_fix_tenant_plan.sql
-- The original plan constraint was missing 'trial', causing the onboarding endpoint to fail.
-- Also update the column default so new tenants start on trial.

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_plan_check
  CHECK (plan IN ('trial','starter','pro','enterprise'));

ALTER TABLE public.tenants
  ALTER COLUMN plan SET DEFAULT 'trial';

ALTER TABLE public.tenants
  ALTER COLUMN plan_limits SET DEFAULT '{"max_os": 20, "max_users": 2}';
