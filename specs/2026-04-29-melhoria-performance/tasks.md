# Tarefas — Melhoria de Performance (Formulários e Change Detection)

Referência: `spec.md` e `plan.md`

## Preparação

- [x] TSK001 Confirmar escopo e ACs na spec (clarificação C1–C4 concluída)
- [x] TSK002 Identificar projetos Nx afetados: `web` (apenas)

## Implementação — Layout (maior impacto)

- [x] TSK010 Adicionar `ChangeDetectionStrategy.OnPush` ao `header.component.ts`
- [x] TSK011 Adicionar `ChangeDetectionStrategy.OnPush` ao `sidebar.component.ts`
- [x] TSK012 Adicionar `ChangeDetectionStrategy.OnPush` ao `sidebar-nav.component.ts`

## Implementação — client-form

- [x] TSK020 Converter `isEdit`, `saving`, `error` para `signal()` em `client-form.component.ts`
- [x] TSK021 Adicionar `clientType` via `toSignal(form.get('type')!.valueChanges)`
- [x] TSK022 Converter getters `cpfCnpjMask`, `cpfCnpjPlaceholder`, `cpfCnpjLabel`, `namePlaceholder` para `computed()`
- [x] TSK023 Converter getter `breadcrumbs` para `computed()` baseado em `isEdit()`
- [x] TSK024 Remover `ChangeDetectorRef` e todos os `markForCheck()` do componente
- [x] TSK025 Adicionar `DestroyRef` + `takeUntilDestroyed` na subscription do `ngOnInit`
- [x] TSK026 Corrigir template: `isEdit/saving/error` → chamadas de signal
- [x] TSK027 Corrigir template: `form.get('type')?.value` → signals `namePlaceholder()`/`cpfCnpjLabel()`
- [x] TSK028 Corrigir template: `form.get('name')?.invalid` → `form.controls.name.invalid`

## Implementação — purchase-order-form

- [x] TSK030 Adicionar `itemTotals = signal<number[]>([])`, `discountValue` e `shippingValue` como signals
- [x] TSK031 Criar `recalcAll()` privado que atualiza `itemTotals`, `subtotal` e `total` sem emitir eventos
- [x] TSK032 Assinar `form.valueChanges.pipe(debounceTime(150), takeUntilDestroyed())` no `ngOnInit`
- [x] TSK033 Atualizar `onProductSelect()` para chamar `recalcAll()` diretamente (feedback imediato)
- [x] TSK034 Atualizar `removeItem()` para chamar `recalcAll()` diretamente
- [x] TSK035 Atualizar `addItem()` para inicializar slot em `itemTotals`
- [x] TSK036 Remover `recalc()` e `itemTotal()` públicos do componente
- [x] TSK037 Remover `firstValueFrom` e import desnecessário
- [x] TSK038 Corrigir template: remover `(onInput)="recalc()"` dos dois `p-inputNumber`
- [x] TSK039 Corrigir template: `{{ itemTotal(i) }}` → `{{ itemTotals()[i] }}`
- [x] TSK040 Corrigir template: `form.get('discount')?.value` → `discountValue()`
- [x] TSK041 Corrigir template: `form.get('shippingCost')?.value` → `shippingValue()`

## Verificação de ACs

- [ ] TSK050 AC01 — Verificar visualmente navegação entre rotas e toggle de tema com Sidebar/Header em OnPush *(manual)*
- [ ] TSK051 AC02 — Digitar 20 caracteres rápidos no campo Nome do formulário de cliente; confirmar ausência de lag *(manual)*
- [x] TSK052 AC03 — Code review: ausência de `(onInput)` ✅ + presença de `valueChanges.pipe(debounceTime(150))` ✅
- [x] TSK053 AC04 — Code review: `itemTotals()[i]` no template ✅ ; ausência de `itemTotal(` ✅
- [x] TSK054 AC05 — Code review: `discountValue()` e `shippingValue()` no template ✅
- [ ] TSK055 AC06 — Clicar "Criar cliente"; confirmar que botão exibe spinner/loading durante a requisição *(manual)*
- [x] TSK056 AC07 — `grep 'form\.get' client-form.component.html` → sem resultados ✅
- [x] TSK057 AC08 — `grep 'ChangeDetectorRef\|markForCheck' client-form.component.ts` → sem resultados ✅

## Entrega

- [x] TSK060 Rodar `npx nx lint web` — sem novos ERROS nos 7 arquivos modificados; warnings de `no-non-null-assertion` são aceitáveis (padrão do projeto); erros em outros arquivos são pré-existentes
- [x] TSK061 Rodar `npx nx test web` — `app.spec.ts` falha pré-existente confirmada com git stash (falha antes e depois das nossas mudanças); nenhum teste dos componentes alterados falhou
- [ ] TSK062 Validação manual no browser (TSK050, TSK051, TSK055) e marcar spec como `Done`
