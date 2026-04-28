# SimplificaOS — Agent Instructions (Repo-Wide)

> Lido por: **OpenAI Codex CLI** e qualquer agente compatível com `AGENTS.md`.
> Para instruções do Claude Code, ver também `CLAUDE.md`.

---

## Identidade do Projeto

**SimplificaOS** é um SaaS multi-tenant para empresas de assistência técnica no Brasil.
Nunca usar "Nexus" em texto visível ao usuário — o nome de produto é **SimplificaOS**.

## Processo — Spec-Driven Development

Antes de implementar qualquer feature:
1. Ler `.specify/constitution.md` — princípios e padrões do projeto
2. Ler `CLAUDE.md` — spec técnica completa (schema, endpoints, regras de negócio)
3. Verificar se existe uma spec em `specs/YYYY-MM-DD-<slug>/spec.md`
4. Se não existir spec: escrever antes de codar

Specs ficam em `specs/`. Templates em `.specify/templates/`.

---

## Stack

- **Frontend:** Angular 21 + SSR · PrimeNG 21 · TailwindCSS
- **Backend:** NestJS 11 · TypeORM
- **Banco:** PostgreSQL via Supabase (RLS multi-tenant)
- **Auth:** Supabase Auth (JWT)
- **Monorepo:** Nx 22.6

---

## Convenções Angular (Frontend)

- Standalone components apenas (`standalone: true`) — sem NgModules
- Usar control flow blocks (`@if`, `@for`, `@switch`) em vez de `*ngIf`/`*ngFor`
- Preferir `signal()`, `computed()`, `inject()` — nunca injeção via construtor
- Lazy loading em todas as features (`loadComponent` / `loadChildren`)
- Não acessar `window`/`document` diretamente — usar token `DOCUMENT` (SSR-safe)

## Convenções PrimeNG

- Importar cada módulo PrimeNG individualmente em `@Component({ imports: [...] })`
- Overlays (`p-dialog`, `p-menu`) precisam de `appendTo="body"`
- Não usar `CUSTOM_ELEMENTS_SCHEMA` ou `NO_ERRORS_SCHEMA` para corrigir erros de template
- Consultar `docs/primeng.md` para API dos componentes

## Convenções de Estilo

- Design tokens em `apps/web/src/styles.css` — nunca hardcode de cores
- Token primário: `--primary-color: #2563EB`
- Modo escuro via `html.dark` — usar os mesmos tokens CSS
- Classes de layout: `.nx-sidebar`, `.nx-header`, `.nx-page`, `.nx-stat`, `.nx-form-*`
- Mobile-first; breakpoint desktop = `lg` (1024px)

---

## Convenções Backend (NestJS)

- DTOs com `class-validator`; sempre `CreateXDto` + `UpdateXDto extends PartialType(...)`
- Guards: `AuthGuard` (JWT) + `PermissionGuard` (RBAC) via `@UseGuards()`
- **Nunca** usar `synchronize: true` no TypeORM
- Soft delete via `@DeleteDateColumn()` + `repo.softDelete()`
- Decorators: `@CurrentTenant()`, `@CurrentUser()`, `@RequirePermission('modulo:acao')`

---

## Banco de Dados

- PK: UUID (`gen_random_uuid()`)
- Toda tabela tem `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- RLS: `USING (tenant_id = current_tenant_id())`
- Soft delete: `deleted_at TIMESTAMPTZ`
- Nomenclatura: snake_case no banco, camelCase no TypeScript
- Migrations em `supabase/migrations/` (numeradas, nunca editar após commit)

---

## Multi-Tenancy

- `service_role` key do Supabase **nunca** vai para o frontend
- `TenantMiddleware` injeta `SET app.tenant_id = <uuid>` em toda request
- RLS no banco filtra automaticamente os dados por tenant
- Testar isolamento antes de qualquer deploy (rodar os blocos SQL da seção 3.8 do tutorial)

---

## RBAC

| Role | Escopo |
|---|---|
| `SUPER_ADMIN` | Cross-tenant; gerencia planos, não opera dentro de tenants |
| `TENANT_ADMIN` | Acesso total ao próprio tenant |
| `TECNICO` | OS e clientes |
| `VENDEDOR` | Vendas, caixa, devoluções |

Matriz completa em `CLAUDE.md` seção 2.2.

---

## Regras de Negócio (resumo)

| RN | Regra |
|---|---|
| RN01 | Soft delete em toda entidade — `deleted_at` |
| RN02 | Verificar limite do plano ao criar OS/orçamento/venda → HTTP 402 |
| RN03 | Cálculo de margem via `@nexus-platform/shared-utils` |
| RN04 | Código auto-gerado: `{PREFIX}-{timestamp_base36}` |
| RN05 | Trial expirado → HTTP 403 `{ code: 'TRIAL_EXPIRED' }` |
| RN06 | Orçamento aprovado → converter em OS (preservar items e equipamento) |
| RN07 | Venda → gera `financial_entry` + parcelas + movimento de caixa |
| RN08 | Devolução aprovada → atualizar estoque, crédito ou estorno |
| RN10 | Uma sessão de caixa por vez; venda PDV exige sessão aberta |
| RN11 | `PermissionGuard` em toda request |
| RN12 | `AuditInterceptor` loga create/update/delete (não loga GETs) |

Detalhamento em `CLAUDE.md` seção 7.

---

## Pacotes Compartilhados

- Tipos: `@nexus-platform/shared-types` (não inventar aliases `@nexus/...`)
- Utilitários: `@nexus-platform/shared-utils`

## Execução com Nx

Preferir comandos Nx para build, test e lint:

```bash
npx nx affected --target=build
npx nx affected --target=test
npx nx affected --target=lint
npx nx build web
npx nx serve api
```

---

## Qualidade

- Cobertura > 80% em services e controllers
- API response (p95) < 200 ms
- RLS: zero vazamentos cross-tenant (AC obrigatório pré-deploy)
- Lighthouse PWA > 90 · Accessibility > 80
