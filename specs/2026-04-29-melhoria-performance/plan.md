# Plano — Melhoria de Performance (Formulários e Change Detection)

Referência: `spec.md`  
Atualizado em: 2026-04-29 (pós-implementação)

## Abordagem

Corrigir os gargalos na ordem de maior impacto:

1. **OnPush no layout** — maior impacto global; afeta toda a árvore de componentes em cada keystroke
2. **Refatorar `client-form`** — converter toda a state para signals (bug fix + performance)
3. **Refatorar `purchase-order-form`** — substituir recalc no input por reactive `valueChanges` e memoizar totais

## Arquitetura e decisões

### Decisão 1 — Layout com OnPush (sem refatoração adicional)

`HeaderComponent`, `SidebarComponent` e `SidebarNavComponent` já usavam `toSignal()` e `computed()` internamente — todos os valores reativos já eram signals. Nenhum deles tinha subscriptions imperativas nem `@Input()` sem signal, portanto adicionar `ChangeDetectionStrategy.OnPush` foi seguro com uma linha por arquivo.

A diretiva `RouterLinkActive` do `SidebarNavComponent` funciona corretamente com `OnPush` porque rastreia o estado do router internamente.

### Decisão 2 — client-form: conversão completa para signals

Escopo expandido após clarificação: além dos getters de máscara, também `isEdit`, `saving` e `error` foram convertidos para `signal()`.

**Motivação:** `saving = true` em `save()` não chamava `markForCheck()`, fazendo o botão de submit nunca exibir estado de loading — bug silencioso. Com signals, a atualização do template é automática.

`ChangeDetectorRef` foi completamente removido do componente.

Signals e computed derivados de `clientType`:

```ts
private readonly clientType = toSignal(
  this.form.get('type')!.valueChanges,
  { initialValue: this.form.get('type')!.value as string },
);
readonly cpfCnpjMask        = computed(() => clientType() === 'company' ? '99.999.999/9999-99' : '999.999.999-99');
readonly cpfCnpjPlaceholder = computed(() => clientType() === 'company' ? '00.000.000/0000-00' : '000.000.000-00');
readonly cpfCnpjLabel       = computed(() => clientType() === 'company' ? 'CNPJ' : 'CPF');
readonly namePlaceholder    = computed(() => clientType() === 'company' ? 'Razão social' : 'Nome completo');
readonly breadcrumbs        = computed<MenuItem[]>(() => [..., { label: isEdit() ? ... : ... }]);
```

Template: todas as referências a `form.get('type')?.value`, `isEdit`, `saving` e `error` convertidas para chamadas de signal. `form.controls.name.invalid` substitui `form.get('name')?.invalid` (acesso direto à propriedade tipada).

### Decisão 3 — purchase-order-form: `signal<number[]>` para totais por item

Opção escolhida: `signal<number[]>` mantido no componente, atualizado pela função `recalcAll()`.

Alternativa descartada: adicionar campo `total` em cada `FormGroup` do item — adicionaria complexidade sem ganho, e o `getRawValue()` no submit incluiria o campo extra.

A função `recalcAll()` recalcula todos os totais de uma vez, é idempotente e não emite eventos:

```ts
private recalcAll() {
  const totals: number[] = [];
  let sub = 0;
  for (let i = 0; i < this.itemsArray.length; i++) {
    const ctrl = this.itemsArray.at(i);
    const total = (ctrl.get('quantity')?.value ?? 0) * (ctrl.get('unitCost')?.value ?? 0);
    totals.push(total); sub += total;
  }
  this.itemTotals.set(totals);
  this.subtotal.set(sub);
  this.total.set(sub - (form.get('discount')?.value ?? 0) + (form.get('shippingCost')?.value ?? 0));
}
```

Gatilhos de `recalcAll()`:
- `form.valueChanges.pipe(debounceTime(150))` — digitação nos campos (debounced)
- `onProductSelect()` — chamada direta para feedback imediato na seleção de produto
- `removeItem()` — chamada direta para atualização imediata ao remover item

### Decisão 4 — Signals para discount e shippingCost no template

`form.get('discount')?.value` e `form.get('shippingCost')?.value` usados em `*ngIf` e interpolação no template substituídos por:

```ts
readonly discountValue  = toSignal(form.get('discount')!.valueChanges,     { initialValue: 0 });
readonly shippingValue  = toSignal(form.get('shippingCost')!.valueChanges, { initialValue: 0 });
```

Template usa `discountValue()` e `shippingValue()` — sem chamada de método, reactivo a mudanças.

## Mudanças por camada

- **Web (Angular/PrimeNG/Tailwind)**:
  - `header.component.ts` — `+ChangeDetectionStrategy.OnPush`
  - `sidebar.component.ts` — `+ChangeDetectionStrategy.OnPush`
  - `sidebar-nav.component.ts` — `+ChangeDetectionStrategy.OnPush`
  - `client-form.component.ts` — `isEdit/saving/error` → signals; getters → `computed()`; `ChangeDetectorRef` removido; `takeUntilDestroyed` no ngOnInit
  - `client-form.component.html` — `form.get('type')?.value` → signals; `isEdit/saving/error` → `isEdit()/saving()/error()`; `form.controls.name` em vez de `form.get('name')`
  - `purchase-order-form.component.ts` — `recalcAll()` reativo via `valueChanges + debounceTime(150)`; `itemTotals/discountValue/shippingValue` como signals; `DestroyRef + takeUntilDestroyed`
  - `purchase-order-form.component.html` — `(onInput)` removidos; `itemTotal(i)` → `itemTotals()[i]`; `form.get()` → signals
- **API (NestJS/TypeORM)**: nenhuma mudança
- **Banco (Postgres/Supabase/RLS)**: nenhuma mudança
- **Shared (`libs/shared-types`, etc.)**: nenhuma mudança

## Riscos e mitigação

| Risco | Status | Mitigação aplicada |
|---|---|---|
| OnPush no Sidebar quebra item ativo (rota atual) | ✅ Mitigado | `RouterLinkActive` funciona com OnPush nativamente |
| OnPush no Header quebra toggle de tema | ✅ Mitigado | `ThemeService` já usa signals — sem impacto |
| `saving = true` sem `markForCheck()` nunca atualiza botão | ✅ Corrigido | `saving` convertido para `signal()` — atualização automática |
| `computed()` não captura valor inicial do form type | ✅ Mitigado | `toSignal(..., { initialValue: form.get('type')!.value })` garante valor imediato |
| `recalcAll()` chamado antes de `itemsArray` ter itens | ✅ Sem risco | Loop `for` sobre `itemsArray.length` — se vazio, não itera |
| Double-call de `recalcAll()` em `onProductSelect` (direto + valueChanges debounced) | ✅ Aceitável | Função idempotente; segundo call produz resultado idêntico |

## Estratégia de validação por AC

- **AC01** — Code review: verificar `ChangeDetectionStrategy.OnPush` nos 3 arquivos de layout; testar navegação entre rotas e toggle de tema
- **AC02** — Manual: abrir `/app/clientes/novo`, digitar 20 caracteres rápido no campo Nome; confirmar resposta imediata
- **AC03** — Code review: verificar ausência de `(onInput)` no HTML; verificar `valueChanges.pipe(debounceTime(150))` no TS
- **AC04** — Code review: verificar `itemTotals()[i]` no template; verificar ausência de `itemTotal(i)` (método)
- **AC05** — Code review: verificar `discountValue()` e `shippingValue()` no template; ausência de `form.get('discount')?.value`
- **AC06** — Manual: abrir `/app/clientes/novo`, clicar "Criar cliente"; confirmar spinner no botão enquanto aguarda resposta
- **AC07** — Code review: `grep 'form.get' client-form.component.html` deve retornar vazio
- **AC08** — Code review: `grep 'ChangeDetectorRef\|markForCheck' client-form.component.ts` deve retornar vazio
