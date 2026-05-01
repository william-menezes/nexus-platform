# Tarefas — Normalização de Layout das Telas

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Confirmar escopo e ACs na spec
- [ ] TSK002 Mapear todas as telas com `<input type="date">` (`grep -r 'type="date"' apps/web/src/app/features`)
- [ ] TSK003 Mapear telas sem `.nx-page-header` padronizado

## CSS Global (impacto imediato em todas as telas)

- [ ] TSK010 Ajustar `.nx-breadcrumb` em `styles.css` para `background: transparent; border: none; padding-left: 0`
- [ ] TSK011 Verificar visualmente o breadcrumb em dashboard, client-list e os-form após a mudança

## Datepicker (Grupo D — escopo pequeno)

- [ ] TSK020 Substituir `<input type="date">` por `<p-datepicker dateFormat="dd/mm/yy" [showIcon]="true">` em `entry-form.component.html`
- [ ] TSK021 Verificar se `DatePickerModule` já está importado em `entry-form.component.ts`; adicionar se faltar
- [ ] TSK022 Testar manualmente o campo de data no formulário de lançamento financeiro

## Header — Telas de Lista (Grupo B)

- [ ] TSK030 `client-list` — padronizar header: título "Clientes", subtítulo, botão "Novo Cliente"
- [ ] TSK031 `os-list` — padronizar header: título "Ordens de Serviço", subtítulo, botão "Nova OS"
- [ ] TSK032 `employee-list` — padronizar header: título "Funcionários", subtítulo, botão "Novo Funcionário"
- [ ] TSK033 `equipment-list` — padronizar header: título "Equipamentos", subtítulo, botão "Novo Equipamento"
- [ ] TSK034 `product-list` — padronizar header: título "Estoque", subtítulo, botão "Novo Produto"
- [ ] TSK035 `contract-list` — padronizar header: título "Contratos", subtítulo, botão "Novo Contrato"
- [ ] TSK036 `quote-list` — padronizar header: título "Orçamentos", subtítulo, botão "Novo Orçamento"
- [ ] TSK037 `purchase-order-list` — padronizar header: título "Pedidos de Compra", subtítulo, botão "Novo Pedido"
- [ ] TSK038 `return-list` — padronizar header: título "Devoluções", subtítulo, botão "Nova Devolução"
- [ ] TSK039 `service-list` — padronizar header: título "Catálogo de Serviços", subtítulo, botão "Novo Serviço"
- [ ] TSK040 `audit-logs` — padronizar header: título "Logs de Auditoria", subtítulo (sem botão de ação)
- [ ] TSK041 `entry-list` (financeiro) — padronizar header: título "Lançamentos", subtítulo, botão "Novo Lançamento"
- [ ] TSK042 `supplier-list` — padronizar header: título "Fornecedores", subtítulo, botão "Novo Fornecedor"

## Header — Telas de Formulário/Detalhe (verificar e ajustar onde falta)

- [ ] TSK050 Revisar `client-form` — confirmar botão Voltar com `routerLink="/app/clientes"`
- [ ] TSK051 Revisar `os-form` — confirmar botão Voltar com `routerLink="/app/os"`
- [ ] TSK052 Revisar `employee-form` — confirmar botão Voltar
- [ ] TSK053 Revisar `equipment-form` — confirmar botão Voltar
- [ ] TSK054 Revisar `contract-form` — confirmar botão Voltar
- [ ] TSK055 Revisar `quote-form` — confirmar botão Voltar
- [ ] TSK056 Revisar `purchase-order-form` — confirmar botão Voltar
- [ ] TSK057 Revisar `return-form` — confirmar botão Voltar
- [ ] TSK058 Revisar `entry-form` — confirmar botão Voltar
- [ ] TSK059 Revisar telas de detalhe (client-detail, os-detail, contract-detail, purchase-order-detail, entry-detail)

## Card Wrapper — Telas de Lista sem p-card (Grupo C)

- [ ] TSK060 `client-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK061 `os-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK062 `employee-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK063 `equipment-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK064 `product-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK065 `supplier-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK066 `service-list` — envolver conteúdo em `<p-card styleClass="w-full">`
- [ ] TSK067 `audit-logs` — envolver conteúdo em `<p-card styleClass="w-full">`

## Responsividade

- [ ] TSK070 Revisar grids de formulários — substituir `grid-cols-2` fixo por `grid-cols-1 md:grid-cols-2`
- [ ] TSK071 Testar manualmente em viewport 375px: header empilha, grids em coluna única

## Verificação e Entrega

- [ ] TSK080 `grep '<input type="date"' apps/web/src/app/features/**/*.html` → zero resultados
- [ ] TSK081 Navegar nas principais telas e verificar breadcrumb + header + card visualmente
- [ ] TSK082 Rodar `npx nx lint web` — sem novos erros nos arquivos modificados
- [ ] TSK083 Atualizar checklist.md e marcar spec como `Done`
