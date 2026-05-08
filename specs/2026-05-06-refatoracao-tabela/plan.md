# Plano — Refatoração de Layout de Tabelas

Referência: `spec.md`

## Abordagem

Padronização via markup HTML + classes Tailwind/CSS, sem criar componente reutilizável. O `client-list.component.html` é o padrão ouro — cada outro componente de listagem deve replicar sua estrutura de container, toolbar e linhas.

**Por que não um componente genérico de tabela?** Cada tabela tem colunas, filtros e lógica de hover distintos. Um wrapper genérico adicionaria abstração prematura e aumentaria a complexidade de manutenção.

## Padrão de referência (client-list)

### Container externo

```html
<div class="rounded-xl border border-surface-border bg-surface-elevated shadow-sm overflow-hidden">
  <!-- Toolbar -->
  <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border flex-wrap">
    <!-- Esquerda: busca -->
    <div class="relative flex-1 min-w-[180px] max-w-sm">
      <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none"></i>
      <input type="text" placeholder="Buscar..." [(ngModel)]="search"
        class="block w-full rounded-md border border-surface-border bg-surface pl-9 pr-3 py-2 text-sm text-text
               placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors" />
    </div>
    <!-- Direita: chips de filtro ou outros controles -->
    <div class="flex items-center gap-1.5 flex-wrap">
      <!-- chips aqui -->
    </div>
  </div>

  <!-- Tabela -->
  <div class="overflow-x-auto">
    <p-table styleClass="nx-data-table p-datatable-sm" ...>
      <ng-template pTemplate="body" let-item>
        <tr class="group">
          <!-- colunas -->
          <td>
            <div class="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <!-- ações -->
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td [attr.colspan]="numCols">
          <div class="nx-table-empty">
            <span class="nx-table-empty__icon"><i class="pi pi-[icon]"></i></span>
            <span class="nx-table-empty__title">Nenhum X encontrado</span>
            <div class="nx-table-empty__description">...</div>
          </div>
        </td></tr>
      </ng-template>
      <ng-template pTemplate="paginatorleft">
        <span class="nx-table-summary">{{ tableSummary() }}</span>
      </ng-template>
    </p-table>
  </div>
</div>
```

### Chip de filtro padrão (quando aplicável)

```html
<button type="button" (click)="setFilter('all')"
  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors"
  [class.border-primary-300]="filter() === 'all'"
  [class.bg-primary-50]="filter() === 'all'"
  [class.text-primary-700]="filter() === 'all'"
  [class.border-surface-border]="filter() !== 'all'"
  [class.bg-surface-elevated]="filter() !== 'all'"
  [class.text-text-muted]="filter() !== 'all'">
  Todos
</button>
```

### Filtro select (quando há p-select de status/tipo)

Componentes que têm `<p-select>` para status/tipo devem mantê-los no toolbar, à direita da busca, com `styleClass="w-40"`.

## Mudanças por camada

- **Web (Angular/Tailwind):** Apenas HTML. Nenhuma mudança em `.ts` (exceto remover `CardModule` dos imports quando não mais usado)
- **API (NestJS):** Nenhuma
- **Banco:** Nenhuma
- **Shared:** Nenhuma — `table-pagination.util` e `formatTableSummary` já existem e são reutilizados

## Componentes por grupo de trabalho

### Grupo A — Com `<p-card>` + toolbar simples (apenas filtro select, sem busca)
- `os-list`, `quote-list`, `contract-list`, `purchase-order-list`, `return-list`, `entry-list`

### Grupo B — Com `<p-card>` + toolbar com busca textual
- `employee-list`, `supplier-list`, `service-list`

### Grupo C — Com `<p-card>` + filtros por tipo/categoria
- `product-list`, `equipment-list`

### Grupo D — Estrutura diferente (sem p-card, sem toolbar padronizado)
- `equipment-type-list`, `sales-list`

## Remoção do CardModule

Para cada componente migrado cujo `.ts` importa `CardModule`, verificar se ainda há `<p-card>` no template. Se não houver, remover `CardModule` do array `imports`.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Quebrar estilo de componente sem `tableSummary()` | Verificar existência do método antes de adicionar slot `paginatorleft` — adicionar o método se ausente |
| `p-card` ainda usado em outra parte do template | Ler o template completo antes de remover `CardModule` |
| Diferentes números de colspan no emptymessage | Contar colunas da tabela antes de setar `colspan` |

## Estratégia de validação

- AC01: grep por `<p-card>` nos componentes do escopo após migração
- AC02–AC06: inspeção visual + grep pelos padrões de classe
- AC07: grep `p-card` no escopo
- AC08: `npx nx build web`
