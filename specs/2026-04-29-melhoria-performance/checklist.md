# Checklist: Melhoria de Performance (Formulários e Change Detection)

Criada em: 2026-04-29  
Referência: `spec.md`

## Produto

- [x] CA01 Critérios de aceite AC01–AC08 definidos e verificáveis
- [x] CA02 Comportamento funcional idêntico ao anterior: nenhuma mudança em lógica de negócio, API ou banco
- [x] CA03 Não-objetivos respeitados: apenas os 7 arquivos identificados foram modificados

## Code Review (automatizado)

- [x] CR01 AC03 — `(onInput)="recalc()"` removido do `purchase-order-form.html` ✅
- [x] CR02 AC03 — `form.valueChanges.pipe(debounceTime(150))` presente no `purchase-order-form.ts` ✅
- [x] CR03 AC04 — `itemTotals()[i]` no template; `itemTotal(` ausente ✅
- [x] CR04 AC05 — `discountValue()` e `shippingValue()` no template ✅
- [x] CR05 AC07 — `form.get(` ausente no `client-form.component.html` ✅
- [x] CR06 AC08 — `ChangeDetectorRef` e `markForCheck` ausentes no `client-form.component.ts` ✅

## Segurança / Tenancy

- [x] SEC01 Sem vazamento multi-tenant: nenhuma lógica de negócio ou query alterada
- [x] SEC02 Nenhuma permissão/RBAC alterada

## Qualidade

- [x] QLT01 Lint: sem novos erros nos arquivos modificados (erros/warnings pré-existentes em outros arquivos não são responsabilidade desta spec)
- [x] QLT02 Testes: `app.spec.ts` falha confirmada como pré-existente; nenhum test dos componentes alterados introduziu nova falha
- [x] QLT03 Sem chamadas de método em templates nos arquivos alterados
- [x] QLT04 Todos os 3 componentes de layout com `ChangeDetectionStrategy.OnPush` explícito

## Validação Manual (pendente — browser)

- [ ] MAN01 AC01 — Navegar entre rotas; sidebar destaca item correto; toggle de tema funciona
- [ ] MAN02 AC02 — Digitar no campo Nome do formulário de cliente: sem delay perceptível
- [ ] MAN03 AC06 — Clicar "Criar cliente": botão exibe spinner/loading durante a requisição
