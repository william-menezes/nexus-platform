# Tarefas — Padronização de UI: Tailwind, Dark Mode, Breadcrumbs e Templates

Referência: `spec.md` e `plan.md`

> **Convenção de execução:** cada grupo é um commit atômico. Rodar `npx nx build web` após cada grupo antes de avançar.
> 
> **Checklist por componente (Grupo A — templates inline):**
> - [ ] Criar `.html` com template extraído
> - [ ] Trocar `template:` por `templateUrl:` no `.ts`
> - [ ] Adicionar `BreadcrumbModule`, `MenuItem`, `ActivatedRoute` nos imports do `.ts`
> - [ ] Adicionar `homeItem`, `breadcrumbs` (e `isEdit` se form) no `.ts`
> - [ ] Adicionar `<p-breadcrumb>` no topo do `.html`
> - [ ] Substituir `bg-white`/`bg-gray-*`/`text-gray-*` → tokens design system
> - [ ] Adicionar `dark:` nas cores semânticas de estado (`bg-blue-50` → `dark:bg-blue-900/20` etc.)
> - [ ] Verificar mobile-first (grids sem breakpoint, inputs sem `w-full`)
>
> **Padrão de breadcrumb por tipo:**
> - **Lista:** `breadcrumbs = [{ label: 'Módulo', routerLink: '/app/modulo' }]`
> - **Form:** `breadcrumbs = computed(() => [..., { label: isEdit() ? item()?.code ?? 'Editar' : 'Novo X' }])`
> - **Detalhe:** `breadcrumbs = computed(() => [..., { label: item()?.code ?? '...' }])`

---

## Preparação

- [x] TSK001 Auditoria completa realizada (2026-04-27): 31 templates inline, 12 arquivos sem dark mode, 40+ sem breadcrumb, 1 botão customizado
- [ ] TSK002 Confirmar que `bg-surface`, `text-text`, `text-text-secondary`, `border-surface-border` funcionam após `refatoracao-tema` (`npx nx build web`)

---

## Grupo 1 — audit-logs (1 componente)

- [ ] TSK010 `audit-logs.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Logs de Auditoria', routerLink: '/app/logs' }]`

---

## Grupo 2 — suppliers (2 componentes)

- [ ] TSK020 `supplier-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Fornecedores', routerLink: '/app/fornecedores' }]`
- [ ] TSK021 `supplier-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Fornecedores', routerLink: '/app/fornecedores' }, { label: isEdit() ? supplier()?.name ?? 'Editar' : 'Novo Fornecedor' }])`

---

## Grupo 3 — services-catalog (2 componentes)

- [ ] TSK030 `service-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Serviços', routerLink: '/app/servicos' }]`
- [ ] TSK031 `service-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Serviços', routerLink: '/app/servicos' }, { label: isEdit() ? service()?.name ?? 'Editar' : 'Novo Serviço' }])`

---

## Grupo 4 — employees (3 componentes)

- [ ] TSK040 `employee-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Funcionários', routerLink: '/app/funcionarios' }]`
- [ ] TSK041 `employee-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Funcionários', routerLink: '/app/funcionarios' }, { label: isEdit() ? employee()?.name ?? 'Editar' : 'Novo Funcionário' }])`
- [ ] TSK042 `invite-employee.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Funcionários', routerLink: '/app/funcionarios' }, { label: 'Convidar Funcionário' }]`

---

## Grupo 5 — equipments (3 componentes)

- [ ] TSK050 `equipment-type-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Equipamentos', routerLink: '/app/equipamentos' }, { label: 'Tipos de Equipamento' }]`
- [ ] TSK051 `equipment-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Equipamentos', routerLink: '/app/equipamentos' }]`
- [ ] TSK052 `equipment-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Equipamentos', routerLink: '/app/equipamentos' }, { label: isEdit() ? equipment()?.model ?? 'Editar' : 'Novo Equipamento' }])`

---

## Grupo 6 — contracts (3 componentes)

- [ ] TSK060 `contract-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Contratos', routerLink: '/app/contratos' }]`
- [ ] TSK061 `contract-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Contratos', routerLink: '/app/contratos' }, { label: isEdit() ? contract()?.code ?? 'Editar' : 'Novo Contrato' }])`
- [ ] TSK062 `contract-detail.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Contratos', routerLink: '/app/contratos' }, { label: contract()?.code ?? '...' }])`

---

## Grupo 7 — returns (3 componentes)

- [ ] TSK070 `return-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Devoluções', routerLink: '/app/vendas/devolucoes' }]`
- [ ] TSK071 `return-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Devoluções', routerLink: '/app/vendas/devolucoes' }, { label: 'Nova Devolução' }]`
- [ ] TSK072 `return-detail.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Devoluções', routerLink: '/app/vendas/devolucoes' }, { label: returnObj()?.code ?? '...' }])`
  - **Atenção:** usar `returnObj` — `return` é palavra reservada em TS

---

## Grupo 8 — purchase-orders (3 componentes)

- [ ] TSK080 `purchase-order-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Pedidos de Compra', routerLink: '/app/compras' }]`
- [ ] TSK081 `purchase-order-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Pedidos de Compra', routerLink: '/app/compras' }, { label: isEdit() ? po()?.code ?? 'Editar' : 'Novo Pedido' }])`
- [ ] TSK082 `purchase-order-detail.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Pedidos de Compra', routerLink: '/app/compras' }, { label: po()?.code ?? '...' }])`

---

## Grupo 9 — financial (5 componentes)

- [ ] TSK090 `entry-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' }]`
- [ ] TSK091 `entry-form.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' }, { label: isEdit() ? entry()?.description ?? 'Editar' : 'Novo Lançamento' }])`
- [ ] TSK092 `entry-detail.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' }, { label: entry()?.description ?? '...' }])`
- [ ] TSK093 `cash-session.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Caixa', routerLink: '/app/financeiro/caixa' }, { label: 'Sessão Atual' }]`
- [ ] TSK094 `chart-of-accounts.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Configurações', routerLink: '/app/configuracoes' }, { label: 'Plano de Contas' }]`

---

## Grupo 10 — settings (4 componentes)

- [ ] TSK100 `settings.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Configurações', routerLink: '/app/configuracoes' }]` (Decisão 6B — shell também tem breadcrumb)
- [ ] TSK101 `general-settings.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Configurações', routerLink: '/app/configuracoes' }, { label: 'Geral' }]`
- [ ] TSK102 `custom-statuses.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Configurações', routerLink: '/app/configuracoes' }, { label: 'Status' }]`
- [ ] TSK103 `permissions.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Configurações', routerLink: '/app/configuracoes' }, { label: 'Permissões' }]`

---

## Grupo 11 — quotes (2 componentes inline restantes)

- [ ] TSK110 `quote-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Orçamentos', routerLink: '/app/orcamentos' }]`
- [ ] TSK111 `quote-detail.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Orçamentos', routerLink: '/app/orcamentos' }, { label: quote()?.code ?? '...' }])`

---

## Grupo 12 — Grupo B (templates já separados — só breadcrumb + dark mode + botão)

- [ ] TSK120 `dashboard.component.html` — dark mode + breadcrumb
  - `breadcrumbs`: `[{ label: 'Dashboard', routerLink: '/app/dashboard' }]`
- [ ] TSK121 `client-list.component.html` — dark mode + breadcrumb + trocar botão Tailwind → `pButton p-button-sm`
  - `breadcrumbs`: `[{ label: 'Clientes', routerLink: '/app/clientes' }]`
- [ ] TSK122 `client-detail.component.html` — dark mode + breadcrumb
  - `breadcrumbs`: `computed(() => [{ label: 'Clientes', routerLink: '/app/clientes' }, { label: client()?.name ?? '...' }])`
- [ ] TSK123 `os-list.component.html` — dark mode + breadcrumb
  - `breadcrumbs`: `[{ label: 'Ordens de Serviço', routerLink: '/app/os' }]`
- [ ] TSK124 `os-detail.component.html` — dark mode + breadcrumb
  - `breadcrumbs`: `computed(() => [{ label: 'Ordens de Serviço', routerLink: '/app/os' }, { label: os()?.code ?? '...' }])`
- [ ] TSK125 `product-list.component.html` — dark mode + breadcrumb
  - `breadcrumbs`: `[{ label: 'Estoque', routerLink: '/app/estoque' }]`
- [ ] TSK126 `sales-list.component.html` — dark mode + breadcrumb
  - `breadcrumbs`: `[{ label: 'Vendas', routerLink: '/app/vendas' }]`
- [ ] TSK127 `pdv.component` — dark mode + breadcrumb (Decisão 5A — PDV incluso)
  - `breadcrumbs`: `[{ label: 'Vendas', routerLink: '/app/vendas' }, { label: 'PDV' }]`
- [ ] TSK128 `dre.component` — dark mode + breadcrumb
  - `breadcrumbs`: `[{ label: 'Financeiro', routerLink: '/app/financeiro' }, { label: 'DRE' }]`

---

## Grupo 13 — admin (3 componentes inline — Decisão 4A)

- [ ] TSK130 `admin-dashboard.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Dashboard Admin', routerLink: '/admin/dashboard' }]`
  - `homeItem`: `{ icon: 'pi pi-home', routerLink: '/admin/dashboard' }`
- [ ] TSK131 `tenant-list.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `[{ label: 'Tenants', routerLink: '/admin/tenants' }]`
- [ ] TSK132 `tenant-detail.component` — extrair template + breadcrumb + dark mode
  - `breadcrumbs`: `computed(() => [{ label: 'Tenants', routerLink: '/admin/tenants' }, { label: tenant()?.name ?? '...' }])`

---

## Testes e qualidade

- [ ] TSK140 `npx nx build web` sem erros após cada grupo implementado
- [ ] TSK141 Validação AC01: `grep -r "template: \`" apps/web/src/app/features --include="*.ts"` → zero resultados
- [ ] TSK142 Validação AC03: `grep -r "bg-white\|bg-gray-50\|bg-gray-100" apps/web/src/app/features --include="*.html"` → zero resultados
- [ ] TSK143 Validação AC04: `grep -r "p-breadcrumb" apps/web/src/app/features` → 40+ resultados
- [ ] TSK144 Validação AC05: `grep -r "inline-flex.*bg-primary" apps/web/src/app/features` → zero resultados
- [ ] TSK145 Inspeção visual mobile 375px: contratos, clientes, OS, financeiro
- [ ] TSK146 Inspeção dark mode: `document.documentElement.classList.toggle('dark')` nas 5 rotas principais

---

## Entrega

- [ ] TSK150 Atualizar `spec.md` — Status: Done
- [ ] TSK151 Conferir DoD no `checklist.md`
- [ ] TSK152 Commit final de limpeza se necessário
