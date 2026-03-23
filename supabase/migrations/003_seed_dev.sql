-- 003_seed_dev.sql

-- Tenant A: assistência de celular
INSERT INTO public.tenants (id, name, slug, plan)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'TechFix Mobile',
  'techfix',
  'starter'
);

-- Tenant B: climatização
INSERT INTO public.tenants (id, name, slug, plan)
VALUES (
  '22222222-0000-0000-0000-000000000002',
  'Ar Frio Serviços',
  'arfrio',
  'pro'
);

-- Vincular tenant_a@teste.com ao Tenant A
-- SUBSTITUIR pelo UUID copiado do dashboard
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  '<UUID_DO_USUARIO_A>',
  'owner'
);

-- Vincular tenant_b@teste.com ao Tenant B
-- SUBSTITUIR pelo UUID copiado do dashboard
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
  '22222222-0000-0000-0000-000000000002',
  '<UUID_DO_USUARIO_B>',
  'owner'
);
