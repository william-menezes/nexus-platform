# Tarefas — Dashboard Administrativo (SUPER_ADMIN)

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Confirmar escopo e ACs na spec com o time
- [ ] TSK002 Criar contas `williamenezes@outlook.com` e `simplificaos01@gmail.com` no Supabase Auth (dev + prod)
- [ ] TSK003 Anotar os UUIDs dos usuários gerados para o script de seed

## Banco de dados

- [ ] TSK010 Criar migration: tabela `super_admins`
- [ ] TSK011 Criar migration: tabela `plans` com seed dos 4 planos padrão (trial/starter/pro/enterprise)
- [ ] TSK012 Criar migration: tabela `coupons`
- [ ] TSK013 Criar script de seed: inserir as 2 contas SUPER_ADMIN em `super_admins` (idempotente por email)
- [ ] TSK014 Validar RLS: `super_admins`, `plans`, `coupons` não vazam para tenants comuns

## Shared types

- [ ] TSK020 Adicionar interfaces em `libs/shared-types`: `Plan`, `Coupon`, `SuperAdmin`, `AdminMetrics`, `TenantAdminView`
- [ ] TSK021 Rodar `npx nx build shared-types` para validar

## Backend — Auth & Guard

- [ ] TSK030 Criar entidade TypeORM `SuperAdmin` (sem tenant_id)
- [ ] TSK031 Atualizar `GET /api/auth/me` para retornar `isSuperAdmin: boolean` (consulta `super_admins` por `user_id`)
- [ ] TSK032 Criar `SuperAdminGuard` NestJS: verifica JWT + `super_admins.user_id`; lança 403 se não for admin
- [ ] TSK033 Garantir que rotas `/api/admin/*` usam apenas `SuperAdminGuard` (não `PermissionGuard` de tenant)

## Backend — Plans

- [ ] TSK040 Criar entidade TypeORM `Plan`
- [ ] TSK041 Criar `PlansController` + `PlansService` com CRUD: `GET /api/admin/plans`, `POST`, `PUT/:id`, `DELETE/:id`
- [ ] TSK042 Validar DTO: `slug` único, `modules` é array de strings válidas, `price >= 0`

## Backend — Coupons

- [ ] TSK050 Criar entidade TypeORM `Coupon`
- [ ] TSK051 Criar `CouponsController` + `CouponsService` com CRUD: `GET /api/admin/coupons`, `POST`, `PATCH/:id`, `DELETE/:id`
- [ ] TSK052 Normalizar `code` para lowercase no DTO e antes de salvar
- [ ] TSK053 Validar lógica de expiração e `max_uses` no service (RN-ADM05)

## Backend — Admin Tenants

- [ ] TSK060 Criar `AdminController` com `GET /api/admin/tenants` (paginado + filtros: nome, plano, status)
- [ ] TSK061 Implementar `GET /api/admin/tenants/:id` com detalhes + subscription
- [ ] TSK062 Implementar `PATCH /api/admin/tenants/:id` (alterar plano, ativar/desativar)
- [ ] TSK063 Implementar `POST /api/admin/tenants/:id/extend-trial` (body: `{days: number}`)
- [ ] TSK064 Implementar `POST /api/admin/tenants/:id/revoke-subscription`
- [ ] TSK065 Registrar `audit_log` em todas as ações de TSK062–TSK064 (RN-ADM07)

## Backend — Métricas

- [ ] TSK070 Implementar `GET /api/admin/metrics`: total tenants ativos, em trial, pagantes, MRR, novos (30d), churn (30d)
- [ ] TSK071 Otimizar query de MRR (JOIN `plans` para pegar preço)

## Frontend — Core

- [ ] TSK080 Criar feature lazy `apps/web/src/app/features/admin/` com `admin.routes.ts`
- [ ] TSK081 Criar `AdminLayoutComponent` com sidebar própria (links: Dashboard, Tenants, Planos, Cupons)
- [ ] TSK082 Criar `SuperAdminGuard` Angular (canActivate): verifica `authService.currentUser?.isSuperAdmin`; redireciona para `/login` se não for admin
- [ ] TSK083 Atualizar `AuthService.redirectAfterLogin()` para checar `isSuperAdmin` e redirecionar para `/admin/dashboard`
- [ ] TSK084 Criar `AdminService` com métodos para todos os endpoints `/api/admin/*`

## Frontend — Dashboard de métricas

- [ ] TSK090 Criar `AdminDashboardComponent` com cards: Total Tenants, Em Trial, Pagantes, MRR
- [ ] TSK091 Adicionar tabela "Últimos 10 tenants criados" e "Tenants com trial expirando hoje/amanhã"

## Frontend — Gestão de tenants

- [ ] TSK100 Criar `TenantListComponent`: tabela paginada, busca por nome, filtro por plano e status
- [ ] TSK101 Criar `TenantDetailComponent`: dados do tenant + subscription + ações (alterar plano, ativar/desativar, estender trial, revogar)
- [ ] TSK102 Modal de confirmação para "Revogar assinatura" e "Desativar tenant"
- [ ] TSK103 Inline select de plano em `TenantDetailComponent` usando a lista de `plans`

## Frontend — Gestão de planos

- [ ] TSK110 Criar `PlanListComponent`: tabela com slug, nome, preço, módulos (badges), status
- [ ] TSK111 Criar `PlanFormComponent`: campos nome, slug, preço, limites, checkboxes de módulos disponíveis
- [ ] TSK112 Validar slug único no frontend (verificar disponibilidade ao digitar)

## Frontend — Gestão de cupons

- [ ] TSK120 Criar `CouponListComponent`: tabela com código, tipo, valor, usos/máximo, validade, status
- [ ] TSK121 Criar `CouponFormComponent`: campos código, tipo (select), valor, validade (datepicker), max_uses
- [ ] TSK122 Exibir badge de status "Expirado", "Esgotado", "Ativo" na listagem

## Testes e qualidade

- [ ] TSK130 Unit test: `SuperAdminGuard` NestJS — bloqueia TENANT_ADMIN, passa SUPER_ADMIN
- [ ] TSK131 Unit test: `CouponsService.validateCoupon()` — expirado, esgotado, ativo
- [ ] TSK132 Unit test: `PlansService` — slug único, módulos válidos
- [ ] TSK133 Integração: `GET /api/admin/tenants` retorna 403 para TENANT_ADMIN
- [ ] TSK134 Rodar `npx nx affected --target=lint`
- [ ] TSK135 Rodar `npx nx affected --target=test`

## Entrega

- [ ] TSK140 Smoke test manual: login com williamenezes@outlook.com → navegar todas as telas admin
- [ ] TSK141 Smoke test manual: login com simplificaos01@gmail.com → confirmar acesso
- [ ] TSK142 Verificar que TENANT_ADMIN não consegue acessar `/admin/*` (redirect para `/app`)
- [ ] TSK143 Conferir DoD no checklist e marcar spec como Done
