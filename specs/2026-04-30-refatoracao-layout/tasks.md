# Tarefas — Refatoração de Layout: Breadcrumb no Header e Padronização de Telas

Referência: `spec.md` e `plan.md`

---

## Grupo A — BreadcrumbService e Header

- [ ] TSK001 Criar `apps/web/src/app/layout/core/breadcrumb/breadcrumb.service.ts` com signals `items` e `home` e método `set()`
- [ ] TSK002 Atualizar `header.component.ts`: importar `BreadcrumbModule`, injetar `BreadcrumbService`
- [ ] TSK003 Atualizar `header.component.html`: adicionar `<p-breadcrumb>` entre o botão de colapso e o espaço flex
- [ ] TSK004 Adicionar CSS mobile ellipsis em `apps/web/src/styles.css` (media query `max-width: 639px`)

Validação: `npx nx build web --configuration=development` deve compilar sem erros

---

## Grupo B — Remover breadcrumb dos componentes de feature

> Para cada componente abaixo: remover `<p-breadcrumb>` do HTML e atualizar o `.ts` para usar o novo `BreadcrumbService` via `set()` no construtor.

- [ ] TSK010 `audit-logs.component`
- [ ] TSK011 `client-list.component` e `client-form.component` e `client-detail.component`
- [ ] TSK012 `contract-list.component` e `contract-form.component` e `contract-detail.component`
- [ ] TSK013 `employee-list.component` e `employee-form.component`
- [ ] TSK014 `equipment-list.component` e `equipment-form.component` e `equipment-type-list.component`
- [ ] TSK015 `entry-list.component` e `entry-form.component` e `entry-detail.component`
- [ ] TSK016 `inventory/product-list.component`
- [ ] TSK017 `purchase-order-list.component` e `purchase-order-form.component` e `purchase-order-detail.component`
- [ ] TSK018 `quote-list.component` e `quote-form.component` e `quote-detail.component`
- [ ] TSK019 `return-list.component` e `return-form.component` e `return-detail.component`
- [ ] TSK020 `service-list.component` e `service-form.component`
- [ ] TSK021 `os-list.component` e `os-form.component` e `os-detail.component`
- [ ] TSK022 `supplier-list.component` e `supplier-form.component`
- [ ] TSK023 `sales-list.component`, `pdv.component`, `dre.component`
- [ ] TSK024 `cash-session.component`, `chart-of-accounts.component`
- [ ] TSK025 `dashboard.component`
- [ ] TSK026 `settings.component` e sub-componentes (general, permissions, custom-statuses)
- [ ] TSK027 `admin/tenant-list.component` e `tenant-detail.component` e `admin-dashboard.component`

Validação: `grep -r "<p-breadcrumb" apps/web/src/app/features` deve retornar zero linhas

---

## Grupo C — Padronizar layout dos headers de página

> Para cada tela de **formulário** e **detalhe**: mover botão Voltar para a esquerda do bloco título+subtítulo (padrão `flex items-center gap-3`).

- [ ] TSK030 `client-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK031 `client-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK032 `contract-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK033 `contract-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK034 `employee-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK035 `equipment-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK036 `entry-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK037 `entry-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK038 `purchase-order-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK039 `purchase-order-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK040 `quote-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK041 `quote-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK042 `return-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK043 `return-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK044 `service-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK045 `os-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK046 `os-detail.component.html` — mover botão Voltar para a esquerda
- [ ] TSK047 `supplier-form.component.html` — mover botão Voltar para a esquerda
- [ ] TSK048 `admin/tenant-detail.component.html` — mover botão Voltar para a esquerda

---

## Grupo D — Padronizar cards dos formulários

> Para cada tela de **formulário**: remover `max-w-*` do card (usar `w-full`); mover botões Salvar/Cancelar para `pTemplate="footer"` dentro do `p-card`; adicionar `id="form-<domain>"` no `<form>` e atributo `form="form-<domain>"` nos botões se necessário.

- [ ] TSK050 `client-form.component.html`
- [ ] TSK051 `contract-form.component.html`
- [ ] TSK052 `employee-form.component.html`
- [ ] TSK053 `equipment-form.component.html`
- [ ] TSK054 `entry-form.component.html`
- [ ] TSK055 `purchase-order-form.component.html`
- [ ] TSK056 `quote-form.component.html`
- [ ] TSK057 `return-form.component.html`
- [ ] TSK058 `service-form.component.html`
- [ ] TSK059 `os-form.component.html`
- [ ] TSK060 `supplier-form.component.html`

---

## Grupo E — Adicionar botão Excluir nas listagens

> Para cada tela de **listagem**: adicionar `<p-confirmDialog />` (se ausente), injetar `ConfirmationService` no `.ts` (se ausente), adicionar método `confirmDelete(item)`, adicionar botão excluir na coluna Ações.

- [ ] TSK070 `client-list.component`
- [ ] TSK071 `contract-list.component`
- [ ] TSK072 `employee-list.component`
- [ ] TSK073 `equipment-list.component`
- [ ] TSK074 `entry-list.component`
- [ ] TSK075 `inventory/product-list.component`
- [ ] TSK076 `purchase-order-list.component`
- [ ] TSK077 `quote-list.component`
- [ ] TSK078 `return-list.component`
- [ ] TSK079 `service-list.component`
- [ ] TSK080 `os-list.component`
- [ ] TSK081 `supplier-list.component`
- [ ] TSK082 `sales-list.component`
- [ ] TSK083 `equipment-type-list.component`
- [ ] TSK084 `admin/tenant-list.component`

---

## Testes e qualidade

- [ ] TSK090 Rodar `npx nx build web` e corrigir erros de compilação
- [ ] TSK091 Rodar `npx nx lint web` e corrigir avisos
- [ ] TSK092 Testar manualmente em viewport 375px: breadcrumb com ellipsis correto
- [ ] TSK093 Testar manualmente 3 telas de formulário: botão voltar esquerda, card full-width, footer com ações
- [ ] TSK094 Testar manualmente 2 telas de listagem: botão excluir abre confirm dialog

## Entrega

- [ ] TSK099 Conferir todos os ACs da spec e marcar spec como Done
