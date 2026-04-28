# SimplificaOS — Constitution

> **Versão:** 1.0 · **Data:** 2026-04-26
> **Modelo:** Spec-Driven Development (SDD) inspirado no GitHub Spec Kit
> **Fonte de verdade técnica:** `CLAUDE.md`

---

## 1. Identidade do Projeto

**SimplificaOS** é um SaaS multi-tenant para empresas de assistência técnica e serviços no Brasil.
Gerencia o ciclo completo: cadastro de clientes → orçamento → aprovação → OS → execução → venda/faturamento → financeiro.

> O projeto era internamente chamado de "Nexus Platform". O nome de produto correto e definitivo é **SimplificaOS**. Nunca usar "Nexus" em texto visível ao usuário.

---

## 2. Princípios Fundamentais

| # | Princípio | Regra prática |
|---|---|---|
| P1 | **Spec primeiro, código depois** | Nenhuma feature começa sem spec + critérios de aceite em `CLAUDE.md` |
| P2 | **TDD obrigatório** | Testes escritos antes da implementação; cobertura > 80% em services/controllers |
| P3 | **Isolamento multi-tenant** | RLS no banco + `TenantMiddleware` no NestJS; zero vazamento entre tenants |
| P4 | **Soft delete em toda entidade** | Campo `deleted_at TIMESTAMPTZ`; queries sempre filtram `WHERE deleted_at IS NULL` |
| P5 | **Audit trail** | `AuditInterceptor` registra create/update/delete/status_change automaticamente |
| P6 | **Sem presunção** | Regra de negócio ausente na spec → perguntar antes de implementar |
| P7 | **PrimeNG primeiro** | Todo componente de UI usa PrimeNG; Tailwind apenas para layout e espaçamento |
| P8 | **Mobile-first** | Toda tela é responsiva; breakpoint desktop é `lg` (1024px) |

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Angular 21 + SSR + PrimeNG 21 + TailwindCSS |
| Backend | NestJS 11 + TypeORM |
| Banco | PostgreSQL via Supabase (RLS multi-tenant) |
| Auth | Supabase Auth (JWT) |
| Monorepo | Nx 22.6 |
| Deploy | Vercel (web) + Render/Docker (API) |
| CI/CD | GitHub Actions |
| Pagamento | Stripe ou AbacatePay (TBD) |

---

## 4. Processo SDD — Como Trabalhamos

### 4.1 Antes de implementar qualquer feature

```
1. Ler CLAUDE.md  →  encontrar a seção relevante
2. Verificar schema do banco  →  tabela, campos, índices, RLS
3. Verificar endpoints  →  rota, método, request/response
4. Verificar regras de negócio  →  RN01–RN12
5. Verificar permissões  →  qual role pode fazer o quê
6. Escrever testes primeiro  (TDD)
7. Implementar
8. Verificar critérios de aceite
```

### 4.2 Critérios de aceite obrigatórios

Todo item entregável deve ter critérios de aceite verificáveis (AC). Sem AC definido, a task não pode entrar em desenvolvimento.

### 4.3 Referência rápida de arquivos-chave

| Arquivo | Propósito |
|---|---|
| `CLAUDE.md` | Spec técnica completa (fonte de verdade) |
| `constitution.md` | Este documento — padrões e processo |
| `docs/nexus_tutorial.md` | Tutorial histórico (referência, pode divergir) |
| `docs/primeng.md` | Documentação dos componentes PrimeNG disponíveis |
| `apps/api/src/app/app.module.ts` | Root module NestJS |
| `apps/web/src/app/app.routes.ts` | Rotas Angular |
| `apps/web/src/app/app.config.ts` | Config Angular (providers) |
| `apps/web/src/styles.css` | Design tokens + classes de layout globais |
| `libs/shared-types/src/index.ts` | Tipos compartilhados |
| `libs/shared-utils/src/index.ts` | Utilitários compartilhados |
| `supabase/migrations/` | Schema do banco (versionado no Git) |

---

## 5. Padrões de Frontend (Angular)

> O agente **`angular-developer`** (`.claude/skills/angular-developer/SKILL.md`) é a referência de boas práticas Angular. Invocá-lo antes de criar componentes, services, rotas ou formas de estado.

### 5.1 Regras gerais

- **Standalone components** — sem NgModules. Todo componente é `standalone: true`.
- **Signals** para estado reativo nos componentes (`signal`, `computed`, `linkedSignal`).
- **`inject()`** para injeção de dependências — nunca via construtor.
- **Lazy loading** em todas as features (`loadComponent` / `loadChildren`).
- **SSR-safe** — não acessar `window`, `document` ou `navigator` diretamente; usar `DOCUMENT` token e `isPlatformBrowser()`.
- **Signal Forms** (Angular 21) para formulários novos; Reactive Forms para formulários existentes ou complexos.

### 5.2 Estrutura de arquivos

```
apps/web/src/app/
├── core/
│   ├── auth/          # AuthService, AuthGuard
│   ├── layout/        # LayoutService
│   ├── tenant/        # TenantService
│   └── theme/         # ThemeService
├── features/
│   └── {domain}/      # Lazy-loaded; um diretório por feature
│       ├── {domain}.routes.ts
│       ├── {domain}.service.ts
│       └── {component}/
│           ├── {component}.component.ts
│           └── {component}.component.html
├── layout/
│   ├── shell/         # ShellComponent (contém header + sidebar + router-outlet)
│   └── components/
│       ├── header/
│       └── sidebar/
└── shared/            # Componentes reutilizáveis cross-feature
```

### 5.3 Padrão de serviço Angular

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/example';

  // Estado reativo com Signal
  readonly items = signal<Item[]>([]);

  getAll() {
    return this.http.get<Item[]>(this.base);
  }
}
```

### 5.4 Padrão de componente Angular

```typescript
@Component({
  standalone: true,
  selector: 'app-example',
  imports: [/* PrimeNG modules + RouterLink etc. */],
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  private readonly service = inject(ExampleService);

  readonly items = computed(() => this.service.items());
}
```

---

## 6. Padrões de UI com PrimeNG

> Consulte sempre `docs/primeng.md` antes de implementar um componente de UI.
> **PrimeNG é o padrão absoluto.** Só usar HTML/CSS puro quando não existir componente equivalente no PrimeNG.

### 6.1 Componentes preferidos por caso de uso

| Caso de uso | Componente PrimeNG |
|---|---|
| Botão de ação | `p-button` |
| Tabela de dados | `p-datatable` |
| Formulário — texto | `p-inputtext` |
| Formulário — select | `p-select` (v21) ou `p-dropdown` |
| Formulário — data | `p-datepicker` |
| Formulário — máscara | `p-inputmask` |
| Formulário — número | `p-inputnumber` |
| Formulário — textarea | `p-textarea` |
| Formulário — checkbox | `p-checkbox` |
| Modal / Dialog | `p-dialog` |
| Toast / Notificação | `p-toast` + `MessageService` |
| Loading | `p-skeleton` (listas) ou `p-progressspinner` |
| Badge de status | `p-tag` |
| Menu dropdown | `p-menu` (popup) |
| Breadcrumb | `p-breadcrumb` |
| Tabs | `p-tabs` (v21) |
| Accordion | `p-accordion` |
| Avatar | `p-avatar` |
| Chip | `p-chip` |
| Tooltip | `pTooltip` (diretiva) |
| Confirmação | `p-confirmdialog` + `ConfirmationService` |

### 6.2 Regras de uso PrimeNG

- Sempre importar o módulo do componente individualmente (tree-shaking).
- Usar `appendTo="body"` em overlays (`p-dialog`, `p-menu`, etc.) para evitar overflow.
- Preferir `severity` do botão (`primary`, `secondary`, `success`, `danger`) ao invés de classes customizadas.
- Usar `size="small"` em botões dentro de tabelas e headers.
- Não sobrescrever estilos internos do PrimeNG com `!important`; usar CSS tokens (`--p-*`) ou classes `styleClass`.

---

## 7. Design System — Tokens de Cor

As cores do SimplificaOS estão definidas em `apps/web/src/styles.css` como variáveis CSS. **Nunca hardcode cores** — usar sempre os tokens.

### 7.1 Tokens principais

| Token | Valor | Uso |
|---|---|---|
| `--primary-color` | `#2563EB` | Ação principal, links, foco |
| `--primary-hover` | `#1D4ED8` | Hover de botões primários |
| `--primary-active` | `#1E40AF` | Active/pressed |
| `--primary-light` | `#DBEAFE` | Fundo de itens ativos no sidebar |
| `--bg-card` | `#FFFFFF` | Fundo de cards, sidebar, header |
| `--bg-light` | `#F8FAFC` | Fundo geral da página |
| `--text-primary` | `#0F172A` | Texto principal |
| `--text-secondary` | `#64748B` | Labels, subtítulos, placeholders |
| `--border-color` | `#E2E8F0` | Bordas de cards, inputs, dividers |
| `--hover-bg` | `#EFF6FF` | Hover de linhas e nav items |
| `--active-bg` | `#DBEAFE` | Item ativo na navegação |

### 7.2 Modo escuro

O modo escuro é ativado pela classe `html.dark`. Os mesmos tokens são sobrescritos automaticamente — nunca usar valores fixos de cor no código.

### 7.3 Classes de layout globais

| Classe | Propósito |
|---|---|
| `.nx-sidebar` | Container do sidebar |
| `.nx-header` | Container do header |
| `.nx-sidebar-link` | Link de navegação do sidebar |
| `.nx-sidebar-link.active` | Estado ativo do link |
| `.nx-page` | Wrapper de página |
| `.nx-page-header` | Cabeçalho da página (título + ações) |
| `.nx-page-title` | Título principal da tela |
| `.nx-page-subtitle` | Subtítulo da tela |
| `.nx-stat` | Card de métrica/KPI |
| `.nx-form` | Wrapper de formulário |
| `.nx-form-group` | Grupo label + input |
| `.nx-form-row.cols-2` | Grid 2 colunas para campos |
| `.nx-form-actions` | Linha de botões do formulário |

---

## 8. Padrões de Backend (NestJS)

### 8.1 Estrutura por módulo

```
apps/api/src/app/modules/{domain}/
├── {domain}.module.ts
├── {domain}.controller.ts
├── {domain}.service.ts
├── entities/
│   └── {entity}.entity.ts
└── dto/
    ├── create-{domain}.dto.ts
    └── update-{domain}.dto.ts
```

### 8.2 Regras

- **DTOs** com `class-validator`. Sempre `CreateXDto` + `UpdateXDto extends PartialType(CreateXDto)`.
- **Guards**: `AuthGuard` (JWT) + `PermissionGuard` (RBAC) via `@UseGuards()`.
- **Decorators customizados**: `@CurrentTenant()`, `@CurrentUser()`, `@RequirePermission('modulo:acao')`.
- **Nunca** usar `synchronize: true` no TypeORM — schema gerenciado pelo Supabase dashboard.
- **Soft delete** via `@DeleteDateColumn()` + `repo.softDelete()`.

---

## 9. Banco de Dados

### 9.1 Convenções

- **PK:** UUID (`gen_random_uuid()`)
- **Tenant isolation:** `tenant_id UUID NOT NULL REFERENCES tenants(id)` em toda tabela
- **RLS:** `USING (tenant_id = current_tenant_id())`
- **Soft delete:** `deleted_at TIMESTAMPTZ`
- **Timestamps:** `created_at`, `updated_at` com trigger
- **Nomenclatura:** snake_case no banco, camelCase no TypeScript
- **Índices:** sempre em `tenant_id` + colunas filtradas frequentemente

### 9.2 Versionamento de migrations

```
supabase/migrations/
├── 001_init_tenants.sql     ← executado ✅
├── 002_init_rls.sql         ← executado ✅
├── NNN_{descricao}.sql      ← próximas: criar, commitar, executar no dashboard
```

Nunca editar um arquivo de migration já commitado. Criar novo para corrigir.

---

## 10. Multi-Tenancy

### 10.1 Fluxo de isolamento

```
Request → AuthGuard (valida JWT) → TenantMiddleware (injeta tenant_id na sessão PG) → RLS filtra automaticamente
```

### 10.2 Regras críticas

- A `service_role` key do Supabase **nunca** vai para o frontend.
- O `TenantMiddleware` injeta `SET app.tenant_id = <uuid>` a cada request.
- A função `current_tenant_id()` no PostgreSQL lê esse valor para o RLS.
- Antes de qualquer deploy, rodar o teste de isolamento (seção 3.8 do tutorial).

---

## 11. RBAC — Roles e Permissões

| Role | Escopo | Resumo |
|---|---|---|
| `SUPER_ADMIN` | Cross-tenant | Gerencia tenants/planos. Não opera dentro de tenants. |
| `TENANT_ADMIN` | Próprio tenant | Acesso total ao tenant. Configura tudo. |
| `TECNICO` | Próprio tenant | OS e clientes. |
| `VENDEDOR` | Próprio tenant | Vendas, caixa, devoluções. |

A matriz completa de permissões por módulo está em `CLAUDE.md` — seção 2.2.

---

## 12. Regras de Negócio (referência rápida)

| RN | Resumo |
|---|---|
| RN01 | Soft delete obrigatório — `deleted_at` em toda entidade principal |
| RN02 | Verificar limite de plano ao criar OS/quote/sale → HTTP 402 se excedido |
| RN03 | Cálculo de margem via `@nexus-platform/shared-utils` |
| RN04 | Código auto-gerado: `{PREFIX}-{timestamp_base36}` |
| RN05 | Trial expirado → HTTP 403 com `{ code: 'TRIAL_EXPIRED' }` |
| RN06 | Orçamento aprovado → converter em OS preservando items e equipamento |
| RN07 | Venda → gera `financial_entry` + `installments` + `cash_movement` |
| RN08 | Devolução aprovada → estoque, crédito ou estorno conforme tipo |
| RN09 | Contrato franquia → calcular horas excedentes no faturamento |
| RN10 | Uma sessão de caixa por vez; toda venda PDV exige sessão aberta |
| RN11 | `PermissionGuard` em toda request: verifica role + permissões do módulo |
| RN12 | `AuditInterceptor` loga create/update/delete/status_change (não loga GETs) |

Detalhamento completo em `CLAUDE.md` — seção 7.

---

## 13. Layout — Comportamento do Shell

- **Desktop (≥ 1024px):** sidebar estático, aberto por padrão. Fecha/abre com o botão do header. Navegar entre telas **não fecha** o sidebar.
- **Mobile (< 1024px):** sidebar é overlay fixo. Fecha automaticamente ao clicar em qualquer item de navegação.
- O serviço `LayoutService` centraliza o estado via `signal`. Usar `closeSidebarOnMobile()` (não `closeSidebar()`) em cliques de navegação.

---

## 14. Qualidade e Testes

| Requisito | Meta |
|---|---|
| Cobertura | > 80% em services e controllers |
| API response (p95) | < 200 ms |
| Lighthouse PWA | > 90 |
| Lighthouse Accessibility | > 80 |
| First Contentful Paint (SSR) | < 1,5 s |
| RLS cross-tenant | 0 vazamentos (AC obrigatório pré-deploy) |

### 14.1 Backend (NestJS)

- `*.spec.ts` ao lado do arquivo testado.
- Mockar repositórios com `jest.fn()`.
- Testes de integração: rodar contra banco real (não mock) para garantir RLS.

### 14.2 Frontend (Angular)

- `*.spec.ts` ao lado do componente.
- `TestBed` com mocks de services.
- Vitest para unit tests; Cypress para E2E.

---

## 15. CI/CD

- Pipeline em `.github/workflows/ci.yml`.
- Jobs: `lint` → `test` → `build` → `docker-build` (apenas em `main`).
- Nx affected: só roda o que mudou.
- Deploy automático: Vercel (web) e Render (API) monitoram a branch `main`.

---

## 16. Plano de Fases

| Fase | Foco |
|---|---|
| **1** | Fundação: RBAC, clientes, audit log, refatorar OS e vendas, custom statuses, tenant settings |
| **2** | Core comercial: orçamentos, equipamentos, funcionários, serviços, financeiro, caixa, PDF |
| **3** | Vendas avançadas: devoluções, barcode, relatórios, WhatsApp, fornecedores |
| **4** | Contratos + subscription: trial, planos, pagamento, faturamento |
| **5** | Estoque avançado: purchase orders, grades, tabelas de preço, relatórios |
| **6** | Futuro: multi-loja, NF-e, app mobile, portal do cliente |

Detalhamento com tasks e critérios de aceite em `CLAUDE.md` — seção 8.
