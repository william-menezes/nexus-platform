# Plano — Normalização de Layout das Telas

Referência: `spec.md`

## Abordagem

Normalizar de fora para dentro:

1. **CSS global** — ajustar `.nx-breadcrumb` para fundo transparente (1 linha, impacto imediato em todas as telas)
2. **Datepicker** — substituir `<input type="date">` por `<p-datepicker>` no `entry-form` (escopo pequeno, verificável)
3. **Header pattern** — padronizar `.nx-page-header` + título + subtítulo + botão Voltar nas telas que ainda não têm
4. **Card wrapper** — envolver conteúdo em `<p-card styleClass="w-full">` nas telas que usam divs soltas

## Arquitetura e decisões

### Decisão 1 — Breadcrumb transparente via CSS

A classe `.nx-breadcrumb` já existe em `styles.css`. Basta adicionar/ajustar:
```css
.nx-breadcrumb {
  background: transparent !important;
  border: none !important;
  padding-left: 0;
}
```
O `!important` é necessário para sobrescrever o estilo inline do PrimeNG.

### Decisão 2 — Padrão HTML do page header

Toda tela deve seguir esta estrutura:
```html
<p-breadcrumb [model]="breadcrumbs()" [home]="homeItem" styleClass="nx-breadcrumb" />

<div class="nx-page-header">
  <div>
    <h1 class="nx-page-title">Título da Tela</h1>
    <p class="nx-page-subtitle">Subtítulo descritivo</p>
  </div>
  <!-- Telas de lista: botão de ação principal (ex: "Novo Cliente") -->
  <!-- Telas de form/detalhe: botão "Voltar" com routerLink -->
  <a routerLink="/app/[rota-pai]" pButton icon="pi pi-arrow-left"
     label="Voltar" severity="secondary" [outlined]="true" size="small" />
</div>
```

### Decisão 3 — Card wrapper para telas sem p-card

Telas de lista que usam tabelas/grids sem `p-card` devem envolver o conteúdo em:
```html
<p-card styleClass="w-full">
  <!-- conteúdo existente -->
</p-card>
```

Telas que já usam múltiplos `p-card` (como forms com seções separadas) mantêm a estrutura atual — não forçar um card único se prejudicar a UX.

### Decisão 4 — Datepicker no entry-form

Substituir:
```html
<input type="date" ...>
```
Por:
```html
<p-datepicker formControlName="dueDate" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full" />
```
Verificar se `DatePickerModule` já está importado no componente.

### Decisão 5 — Responsividade

A classe `.nx-page-header` já define `flex-wrap: wrap` — o botão já empilha em mobile. Verificar apenas que grids de formulários usam `grid-cols-1 md:grid-cols-2` (não `grid-cols-2` fixo).

## Mudanças por camada

- **Web — CSS global** (`styles.css`): ajuste em `.nx-breadcrumb`
- **Web — entry-form** (`entry-form.component.html` + `.ts`): `<input type="date">` → `<p-datepicker>`
- **Web — telas sem header padrão**: adicionar `.nx-page-header` com título, subtítulo e botão voltar
- **Web — telas sem card wrapper**: envolver conteúdo em `<p-card styleClass="w-full">`
- **API / Banco / Shared**: nenhuma mudança

## Telas a atualizar (prioridade)

### Grupo A — Apenas breadcrumb (CSS resolve automaticamente)
Todas as ~43 telas com `<p-breadcrumb>` são corrigidas pela mudança no CSS.

### Grupo B — Header precisa de padronização
Telas que **faltam** subtítulo ou botão Voltar padronizado:
- `client-list`, `os-list`, `employee-list`, `equipment-list`, `product-list`
- `contract-list`, `quote-list`, `purchase-order-list`, `return-list`, `service-list`
- `audit-logs`, `financial/entry-list`, `suppliers/supplier-list`

### Grupo C — Conteúdo sem card wrapper
- `dashboard` (tem sua própria estrutura — manter)
- `client-list`, `os-list`, `employee-list`, `equipment-list`, `product-list`
- `supplier-list`, `service-list`, `audit-logs`

### Grupo D — Datepicker
- `entry-form.component.html` — único com `<input type="date">` nativo

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| `background: transparent` no breadcrumb causa flash em dark mode | Baixa | Baixo | Usar `var(--surface-ground)` em vez de `transparent` se necessário |
| `p-card` em telas de lista quebra o layout da tabela (padding interno) | Média | Médio | Usar `:host ::ng-deep` ou `styleClass` para remover padding interno se necessário |
| Grids de formulário com `grid-cols-2` fixo quebram em mobile | Baixa | Médio | Já usado `md:grid-cols-2` na maioria; verificar exceções |

## Estratégia de validação por AC

- **AC01** — `grep 'nx-breadcrumb' styles.css` confirma `background: transparent`; navegar em 3 telas e verificar visualmente
- **AC02** — Code review: cada tela de form/detalhe tem `.nx-page-header` com `h1` + `p` + botão Voltar
- **AC03** — Code review: cada tela de lista tem `.nx-page-header` com `h1` + `p` + botão de ação
- **AC04** — `grep '<p-card' [tela].html` retorna resultado; conteúdo envolvido corretamente
- **AC05** — `grep '<input type="date"' apps/web/src/app/features/**/*.html` → zero resultados
- **AC06** — Chrome DevTools: simular iPhone 375px; header e grids empilham corretamente
