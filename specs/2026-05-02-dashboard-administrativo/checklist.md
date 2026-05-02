# Checklist: Dashboard Administrativo (SUPER_ADMIN)

Criada em: 2026-05-02  
Referência: `spec.md`

## Produto

- [ ] CA01 Critérios de aceite AC01–AC10 revisados e objetivos claros
- [ ] CA02 Não-objetivos explícitos: SUPER_ADMIN não acessa operações de tenant

## Segurança / Tenancy

- [ ] SEC01 `super_admins`, `plans` e `coupons` não têm RLS de tenant — validar que tenant comum não acessa via API
- [ ] SEC02 `SuperAdminGuard` NestJS bloqueia qualquer JWT sem entrada em `super_admins`
- [ ] SEC03 Rotas `/admin/*` Angular bloqueadas para não-SUPER_ADMIN (redirect para `/login`)
- [ ] SEC04 SUPER_ADMIN não consegue acessar endpoints `/app/*` de tenant (403 ou redirect)
- [ ] SEC05 Ações de admin registradas em `audit_logs` com `tenant_id` do afetado

## Qualidade

- [ ] QLT01 Testes cobrindo: guard SUPER_ADMIN, validação de cupom, CRUD de planos
- [ ] QLT02 Lint/test passando em `web`, `api`, `shared-types`
- [ ] QLT03 Smoke test com ambas as contas SUPER_ADMIN em ambiente de dev

## Banco

- [ ] DB01 Migrations criadas e aplicadas: `super_admins`, `plans`, `coupons`
- [ ] DB02 Seed de planos padrão executado (trial/starter/pro/enterprise)
- [ ] DB03 Seed das contas SUPER_ADMIN executado com UUIDs corretos
- [ ] DB04 RLS verificado: tabelas globais não vazam dados entre tenants nem para usuários anônimos
