# Melhoria de Performance — Formulários e Change Detection

Status: In Progress  
Owner: [@william.damascena]  
Criada em: 2026-04-29  
Links: —

## Contexto

Usuários relataram inputs com delay de digitação em formulários da aplicação. A causa raiz identificada é uma combinação de:

1. **Componentes de layout (Header, Sidebar, SidebarNav) sem `OnPush`** — ficam no modo Default, fazendo Angular percorrer toda a árvore de componentes a cada evento de input, incluindo qualquer keystroke.
2. **`recalc()` chamado em `(onInput)` sem debounce** no `purchase-order-form` — executa um loop no FormArray a cada tecla pressionada.
3. **Método `itemTotal(i)` chamado diretamente no template** — não memoizado, recalculado a cada ciclo de detecção de mudanças.
4. **Getters sem memoização no `client-form`** — `cpfCnpjMask` e `cpfCnpjPlaceholder` acessam `form.get('type')?.value` a cada render.

Esses problemas, especialmente o n.º 1, degradam toda a experiência de digitação em qualquer formulário da aplicação.

## Objetivos

- [ ] Todos os componentes de layout (`HeaderComponent`, `SidebarComponent`, `SidebarNavComponent`) usam `ChangeDetectionStrategy.OnPush`
- [ ] `recalc()` no `purchase-order-form` é chamado com debounce via `valueChanges` — nunca em `(onInput)` no template
- [ ] `itemTotal(i)` no template de `purchase-order-form` substituído por `signal<number[]>` atualizado reativamente
- [ ] `form.get('discount')?.value` e `form.get('shippingCost')?.value` no template substituídos por signals
- [ ] `client-form`: `isEdit`, `saving` e `error` convertidos para signals (fix de bug: `saving = true` não atualizava o botão)
- [ ] `client-form`: getters `cpfCnpjMask`, `cpfCnpjPlaceholder`, `cpfCnpjLabel`, `namePlaceholder` convertidos para `computed()`
- [ ] `client-form`: referências a `form.get('type')?.value` removidas do template HTML
- [ ] `ChangeDetectorRef` removido do `client-form` (não necessário após migração para signals)
- [ ] Nenhuma regressão funcional nos formulários afetados

## Não-objetivos

- [ ] Refatoração de outros componentes além dos 6 identificados
- [ ] Adição de lazy loading ou code splitting
- [ ] Otimizações de rede (HTTP caching, memoização de requisições)
- [ ] Mudanças no backend

## Usuários e cenários

### Cenário 1 — Digitação em formulário com layout lento

**Dado** que o usuário está em qualquer formulário (ex: `/app/clientes/novo`)  
**Quando** digita no campo "Nome"  
**Então** o input responde imediatamente, sem lag ou delay perceptível

### Cenário 2 — Adição de itens em Pedido de Compra

**Dado** que o usuário está em `/app/compras/nova` com pelo menos 3 itens adicionados  
**Quando** digita a quantidade ou preço unitário de um item  
**Então** o cálculo do total é atualizado sem travar a digitação (debounce de 300ms)

### Cenário 3 — Formulário de Cliente com CPF/CNPJ

**Dado** que o usuário está no formulário de cliente  
**Quando** alterna entre "Pessoa Física" e "Pessoa Jurídica"  
**Então** a máscara muda corretamente sem re-render desnecessário

## Regras de negócio

- Não há regras de negócio específicas. Esta é uma melhoria técnica de performance.
- O comportamento funcional deve ser idêntico ao atual após as mudanças.

## Critérios de aceite

- AC01 — `HeaderComponent`, `SidebarComponent` e `SidebarNavComponent` declarados com `changeDetection: ChangeDetectionStrategy.OnPush` e sem regressões visuais
- AC02 — Digitação no campo "Nome" do formulário de cliente não apresenta delay perceptível
- AC03 — No `purchase-order-form`, nenhum `(onInput)` ou `(onChange)` chama `recalc()` diretamente; o total é atualizado via `form.valueChanges.pipe(debounceTime(150))`
- AC04 — `itemTotals()[i]` é usado no template de `purchase-order-form` (signal de array, não método)
- AC05 — `form.get('discount')?.value` e `form.get('shippingCost')?.value` removidos do template HTML; substituídos por signals
- AC06 — `client-form`: `saving`, `isEdit` e `error` são signals; botão de submit exibe estado de loading corretamente ao clicar
- AC07 — `client-form`: nenhuma chamada a `form.get('type')?.value` no template HTML; máscara e placeholder reativos via `computed()`
- AC08 — `ChangeDetectorRef` removido do `client-form` (zero `markForCheck()` necessário)

## Impacto técnico

- Projetos Nx afetados: `web`
- API: nenhuma mudança
- Banco: nenhuma mudança
- Permissões (RBAC): nenhuma mudança
- Arquivos afetados:
  - `apps/web/src/app/layout/components/header/header.component.ts`
  - `apps/web/src/app/layout/components/sidebar/sidebar.component.ts`
  - `apps/web/src/app/layout/components/sidebar/sidebar-nav.component.ts`
  - `apps/web/src/app/features/purchase-orders/components/purchase-order-form/purchase-order-form.component.ts`
  - `apps/web/src/app/features/purchase-orders/components/purchase-order-form/purchase-order-form.component.html`
  - `apps/web/src/app/features/clients/components/client-form/client-form.component.ts`
  - `apps/web/src/app/features/clients/components/client-form/client-form.component.html`

## Plano de testes

- Unit: verificar que `recalc()` não é chamado mais de 1x por evento (spy + debounce)
- Manual: abrir cada formulário afetado e digitar; confirmar ausência de lag
- Regressão visual: navegar em Header e Sidebar após OnPush; confirmar que itens ativos, toggles e notificações continuam funcionando

## Rollout

- Feature flag: não
- Backwards compatibility: total — mudanças são internas e transparentes
- Migrações: nenhuma
