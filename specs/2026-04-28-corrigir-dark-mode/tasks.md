# Tarefas — Correção de Dark Mode, Contraste de Botão e Headers de Página

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Confirmar escopo e ACs com o usuário
- [ ] TSK002 Inspecionar DevTools no dark mode atual para mapear tokens PrimeNG exatos usados pelos componentes (`--p-card-background`, `--p-datatable-header-background`, etc.)

## Frente 1 — Dark Mode (styles.css)

- [ ] TSK010 Expandir bloco `html.dark` em `styles.css` com overrides dos tokens `--p-surface-*` (escala Slate-900/800/700)
- [ ] TSK011 Adicionar tokens `--p-content-*` e `--p-inputtext-*` no `html.dark`
- [ ] TSK012 Adicionar tokens `--p-select-*`, `--p-datepicker-*` e `--p-textarea-*` no `html.dark`
- [ ] TSK013 Adicionar tokens `--p-datatable-header-background` e `--p-datatable-body-row-background` no `html.dark`
- [ ] TSK014 Adicionar token `--p-card-background`, `--p-card-color`, `--p-card-border-color` no `html.dark`
- [ ] TSK015 Garantir `--p-breadcrumb-background: transparent` no `html.dark`
- [ ] TSK016 Corrigir `--p-datatable thead th` — remover hardcode `#F1F5F9`, usar `var(--p-surface-900)` ou similar com dark mode override

## Frente 2 — Contraste do Botão Primário

- [ ] TSK020 Adicionar `color: #FFFFFF` ao seletor `.p-button:not(.p-button-text):not(.p-button-outlined):not(.p-button-link)` em `styles.css`
- [ ] TSK021 Adicionar `contrastColor: '#FFFFFF'` ao `NexusPreset` em `app.config.ts`
- [ ] TSK022 Verificar que botões `p-button-outlined` e `p-button-text` não são afetados (cores já corretas)

## Frente 3 — Padronização de Headers

- [ ] TSK030 Substituir todos os `<h1 class="text-2xl font-bold ...">` por `<h1 class="nx-page-title">` nos HTMLs de features (lista, form, detalhe)
- [ ] TSK031 Envolver heading e botão de ação em `<div class="nx-page-header"><div>...</div></div>` nos componentes que ainda usam `flex justify-between items-center mb-4` inline
- [ ] TSK032 Adicionar `<p class="nx-page-subtitle">` com texto descritivo em cada componente de lista
- [ ] TSK033 Adicionar `<p class="nx-page-subtitle">` em componentes de form (ex.: "Preencha os dados abaixo")
- [ ] TSK034 Adicionar `<p class="nx-page-subtitle">` em componentes de detalhe (ex.: código + fornecedor, ou código + status)

**Escopo de TSK030–034 (telas afetadas):**

Listas: clients, os-list, product-list, sales-list, pdv, quote-list, purchase-order-list, return-list, employee-list, supplier-list, service-list, equipment-list, equipment-type-list, contract-list, entry-list, chart-of-accounts, cash-session, audit-logs, dre, tenant-list

Forms: client-form, os-form, product-form, quote-form, purchase-order-form, return-form, employee-form, supplier-form, service-form, equipment-form, contract-form, entry-form, general-settings, custom-statuses, permissions

Detalhes: client-detail, os-detail, quote-detail, purchase-order-detail, return-detail, entry-detail, contract-detail, tenant-detail

## Testes e qualidade

- [ ] TSK040 Ativar dark mode → verificar fundos de p-card, p-table, inputs em 5 telas (DevTools computed styles)
- [ ] TSK041 Verificar contraste do botão primário com DevTools (≥ 4.5:1)
- [ ] TSK042 Rodar `grep -r "text-2xl font-bold" apps/web/src/app/features --include="*.html"` → zero resultados
- [ ] TSK043 Rodar `npx nx build web` → zero erros

## Entrega

- [ ] TSK050 Atualizar `checklist.md` com itens verificados
- [ ] TSK051 Marcar spec como Done
- [ ] TSK052 Commit com mensagem descritiva
