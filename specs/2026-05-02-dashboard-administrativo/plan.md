# Plano — Dashboard Administrativo (SUPER_ADMIN)

Referência: `spec.md`

## Abordagem

Implementar o painel admin como uma rota Angular separada (`/admin/*`) com lazy loading próprio, protegida por um `SuperAdminGuard` que consulta a tabela `super_admins` (sem tenant_id). No backend, um módulo NestJS `AdminModule` separado do módulo `AuthModule` tenant-scoped, com seus próprios guards e controllers.

As duas contas SUPER_ADMIN são provisionadas via script de seed SQL + Supabase Auth (CLI ou Edge Function). Os dados de planos e cupons ficam em tabelas globais sem `tenant_id` (não aplicam RLS de tenant).

## Arquitetura e decisões

- **`super_admins` table sem tenant_id:** SUPER_ADMIN é uma entidade de plataforma, não de tenant. Usar tabela separada evita poluir `tenant_users` e simplifica o guard.
- **`plans` table global:** Define os planos disponíveis com `modules: string[]` (JSONB). O campo `tenants.plan` passa a ser uma string que corresponde a `plans.slug` — mantemos string para não quebrar RLS existente imediatamente; em fase futura adicionar FK.
- **Módulos como lista de strings:** `["clients","service_orders","sales","inventory","financial","contracts","reports"]`. O `PermissionGuard` verifica se o módulo requisitado está em `plans.modules` do tenant antes de checar RBAC granular.
- **`coupons` table global:** Código único (lower-case normalizado), tipo `percentage`/`fixed`, `valid_until`, `max_uses`, `uses_count`. Aplicação do cupom (tela de upgrade) fica fora do escopo desta spec — aqui apenas CRUD.
- **MRR calculado em runtime:** query `SELECT SUM(p.price) FROM tenants t JOIN plans p ON t.plan = p.slug JOIN subscriptions s ON s.tenant_id = t.id WHERE s.status = 'active'`. Sem necessidade de coluna desnormalizada por enquanto.

## Mudanças por camada

### Web (Angular/PrimeNG/Tailwind)

- Nova feature lazy: `apps/web/src/app/features/admin/`
  - `admin.routes.ts` — rotas `/admin/*`
  - `admin-layout/` — layout próprio (sidebar diferente do layout de tenant)
  - `dashboard/admin-dashboard.component.ts` — métricas globais com cards
  - `tenants/tenant-list.component.ts` — tabela paginada com busca e filtros
  - `tenants/tenant-detail.component.ts` — form de edição + ações (estender trial, revogar)
  - `plans/plan-list.component.ts` — lista de planos
  - `plans/plan-form.component.ts` — criar/editar plano com checkbox de módulos
  - `coupons/coupon-list.component.ts` — lista de cupons
  - `coupons/coupon-form.component.ts` — criar/editar cupom
- `SuperAdminGuard` (`apps/web/src/app/core/guards/super-admin.guard.ts`) — verifica `authService.currentUser.isSuperAdmin`
- `AdminService` (`apps/web/src/app/features/admin/admin.service.ts`) — chamadas HTTP para `/api/admin/*`
- Redirecionar após login: `AuthService.redirectAfterLogin()` verifica `isSuperAdmin` e redireciona para `/admin/dashboard` ao invés de `/app/dashboard`

### API (NestJS/TypeORM)

- Novo módulo: `apps/api/src/app/modules/admin/admin.module.ts`
  - `admin.controller.ts` — rotas `/admin/*`
  - `admin.service.ts` — lógica de negócio
  - `plans.controller.ts` + `plans.service.ts`
  - `coupons.controller.ts` + `coupons.service.ts`
- Nova entidade: `SuperAdmin` (sem tenant_id)
- Nova entidade: `Plan` (global)
- Nova entidade: `Coupon` (global)
- `SuperAdminGuard` (NestJS) — verifica JWT + consulta `super_admins` por `user_id`
- `GET /api/auth/me` — adicionar campo `isSuperAdmin: boolean` na resposta

### Banco (Postgres/Supabase)

```sql
-- super_admins: não tem tenant_id, sem RLS de tenant
CREATE TABLE public.super_admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- plans: tabela global de planos disponíveis
CREATE TABLE public.plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,          -- 'trial','starter','pro','enterprise'
  name        TEXT NOT NULL,                 -- 'Trial', 'Starter', etc.
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  modules     JSONB NOT NULL DEFAULT '[]',   -- ["clients","service_orders",...]
  limits      JSONB NOT NULL DEFAULT '{}',   -- {"max_os":100,"max_users":3}
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- coupons: cupons de desconto (globais, sem tenant_id)
CREATE TABLE public.coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,           -- normalizado lowercase
  type        TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value       NUMERIC(10,2) NOT NULL,         -- % ou R$
  valid_until TIMESTAMPTZ,                    -- NULL = sem expiração
  max_uses    INTEGER,                        -- NULL = ilimitado
  uses_count  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: planos padrão
INSERT INTO plans (slug, name, price, modules, limits, sort_order) VALUES
  ('trial',      'Trial',      0,    '["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]', '{"max_os":20,"max_users":2}',          0),
  ('starter',    'Starter',    49,   '["clients","service_orders","sales","inventory","settings"]',                                   '{"max_os":100,"max_users":3}',         1),
  ('pro',        'Pro',        99,   '["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]',  '{"max_os":1000,"max_users":10}',      2),
  ('enterprise', 'Enterprise', 199,  '["clients","service_orders","sales","inventory","financial","contracts","reports","settings"]',  '{"max_os":null,"max_users":null}',    3);

-- Seed: super admins
INSERT INTO super_admins (user_id, name, email) VALUES
  ('1484209a-949d-4486-abab-e7dcff8d0f74', 'William',          'williamenezes@outlook.com'),
  ('9ccc9095-daaf-45f3-a6f1-5c2a58e2acdd', 'SimplificaOS Admin', 'simplificaos01@gmail.com');
```

- **RLS:** `super_admins`, `plans`, `coupons` não têm RLS de tenant. Política: apenas `super_admins` podem acessar (via função `is_super_admin()` que consulta a tabela `super_admins`).

### Shared (`libs/shared-types`)

- Novos tipos: `Plan`, `Coupon`, `SuperAdmin`, `AdminMetrics`, `TenantAdminView`

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Contas SUPER_ADMIN criadas manualmente no Supabase Auth podem mudar de user_id entre envs | Script de seed idempotente que busca por email antes de inserir |
| Alterar `plans.modules` quebra tenants em produção | Mudança aditiva primeiro (adicionar módulo nunca quebra); remoção de módulo requer review |
| `tenants.plan` (string) vs `plans.slug` fora de sincronia | Adicionar constraint CHECK ou trigger que valida `tenants.plan IN (SELECT slug FROM plans)` |
| Cupom de desconto aplicado a assinatura (integração com gateway) | Escopo da spec é apenas CRUD; aplicação do cupom fica para spec de payments |

## Estratégia de validação

| AC | Como verificar |
|---|---|
| AC01 | Login manual com ambas as contas; checar redirect |
| AC02 | Criar 3 tenants de teste com planos diferentes; filtrar na lista |
| AC03 | Alterar plano no admin; verificar `tenants.plan` no Supabase Studio |
| AC04 | Setar `trial_ends_at` para ontem; verificar bloqueio; estender; verificar desbloqueio |
| AC05 | Revogar assinatura; verificar `subscription.status` no banco |
| AC06 | Criar plano novo via UI; verificar na tabela `plans` |
| AC07 | Editar módulos do plano; verificar menu do tenant muda |
| AC08 | Criar cupom; verificar na tabela `coupons` |
| AC09 | Comparar métricas da UI com query direta no banco |
| AC10 | Fazer ação; consultar `audit_logs` com `entity = 'tenant'` |
