# Plano — Refatoração de Layout: Breadcrumb no Header e Padronização de Telas

Referência: `spec.md`

## Abordagem

Refatoração em três frentes independentes e sequenciais:

1. **BreadcrumbService + Header** — Criar um serviço de breadcrumb baseado em signals e mover o `p-breadcrumb` para o `HeaderComponent`. Cada feature component passa a injetar o novo serviço e chamar `.set()` com seus itens.

2. **CSS mobile ellipsis** — Adicionar regras em `styles.css` para truncar itens intermediários do breadcrumb em viewports < 640px, garantindo que o último item sempre apareça completo.

3. **Padronização de templates** — Ajustar os templates HTML de todas as telas de listagem, formulário e detalhe para seguir o padrão definido na spec.

A ordem é importante: (1) deve ser feito antes de (3), pois (3) inclui remover o `<p-breadcrumb>` dos templates de feature.

## Arquitetura e decisões

### BreadcrumbService

```typescript
// apps/web/src/app/layout/core/breadcrumb/breadcrumb.service.ts
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _items = signal<MenuItem[]>([]);
  private readonly _home  = signal<MenuItem>({ icon: 'pi pi-home', routerLink: '/app/dashboard' });

  readonly items = this._items.asReadonly();
  readonly home  = this._home.asReadonly();

  set(items: MenuItem[], home?: MenuItem): void {
    this._items.set(items);
    if (home) this._home.set(home);
  }
}
```

Cada feature component injeta `BreadcrumbService` e chama `set()` no construtor ou em `ngOnInit`. Como o Angular destrói e recria componentes ao navegar, o breadcrumb é sempre sobrescrito pelo componente entrante — sem necessidade de reset explícito.

### Header com breadcrumb

O breadcrumb fica entre o botão de colapso (esquerda) e o grupo theme+avatar (direita), ocupando o espaço flex disponível:

```html
<!-- LEFT — toggle -->
<div class="flex items-center gap-1 flex-1 min-w-0">
  <p-button icon="pi pi-bars" ... />
  <!-- Breadcrumb centralizado no espaço restante -->
  <p-breadcrumb [model]="breadcrumb.items()" [home]="breadcrumb.home()"
                styleClass="nx-breadcrumb" />
</div>
<!-- RIGHT — theme + avatar -->
```

### CSS mobile ellipsis

A estratégia é limitar `max-width` dos itens intermediários em mobile. O último item (`li:last-child`) recebe `white-space: nowrap` mas sem restrição de largura.

```css
@media (max-width: 639px) {
  .nx-breadcrumb.p-breadcrumb .p-breadcrumb-item:not(:last-child) .p-breadcrumb-item-link {
    max-width: 6rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: middle;
  }
  .nx-breadcrumb.p-breadcrumb .p-breadcrumb-item:last-child .p-breadcrumb-item-link {
    white-space: nowrap;
  }
}
```

### Padrão de header de página

**Listagem:**
```html
<div class="nx-page-header">
  <div>
    <h1 class="nx-page-title">Título</h1>
    <p class="nx-page-subtitle">Subtítulo</p>
  </div>
  <a routerLink="novo">
    <p-button label="Novo X" icon="pi pi-plus" styleClass="p-button-sm" />
  </a>
</div>
```

**Formulário / Detalhe — botão voltar à esquerda:**
```html
<div class="nx-page-header">
  <div class="flex items-center gap-3">
    <a routerLink="..">
      <p-button icon="pi pi-arrow-left" [text]="true" severity="secondary"
                pTooltip="Voltar" styleClass="p-button-sm" />
    </a>
    <div>
      <h1 class="nx-page-title">Título</h1>
      <p class="nx-page-subtitle">Subtítulo</p>
    </div>
  </div>
</div>
```

### Padrão de card para formulário

Card ocupa `w-full` (sem `max-w-*`). Ações ficam no `footer` template do `p-card`:

```html
<p-card styleClass="w-full">
  <form [formGroup]="form" (ngSubmit)="save()" class="nx-form">
    <!-- campos -->
  </form>
  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">
      <p-button type="button" label="Cancelar" severity="secondary" [outlined]="true"
                routerLink=".." styleClass="p-button-sm" />
      <p-button type="submit" label="Salvar" icon="pi pi-check"
                [loading]="saving()" [disabled]="form.invalid" styleClass="p-button-sm"
                (onClick)="save()" />
    </div>
  </ng-template>
</p-card>
```

> **Nota:** O `p-button` de submit dentro do `pTemplate="footer"` precisa de `(onClick)="save()"` pois está fora do `<form>`. Alternativa: mover o `</form>` para após o footer ou usar `form` attribute no button. Preferir usar `form="form-id"` no button e `id="form-id"` no `<form>`.

### Botão excluir nas listagens

```html
<td>
  <div class="flex items-center justify-end gap-1">
    <a [routerLink]="item.id" pButton icon="pi pi-eye" class="p-button-sm p-button-text" />
    <a [routerLink]="[item.id, 'editar']" pButton icon="pi pi-pencil" class="p-button-sm p-button-text" />
    <p-button icon="pi pi-trash" severity="danger" [text]="true"
              styleClass="p-button-sm" (onClick)="confirmDelete(item)" />
  </div>
</td>
```

O método `confirmDelete(item)` usa `ConfirmationService` do PrimeNG (já importado em muitos componentes via `p-confirmDialog`). Componentes que ainda não têm `p-confirmDialog` precisam adicioná-lo.

## Mudanças por camada

- **Web (Angular/PrimeNG/Tailwind):**
  - Novo serviço: `layout/core/breadcrumb/breadcrumb.service.ts`
  - Atualizar: `header.component.ts` (imports + inject BreadcrumbService + BreadcrumbModule)
  - Atualizar: `header.component.html` (adicionar p-breadcrumb)
  - Atualizar: `styles.css` (CSS mobile ellipsis)
  - Atualizar: ~90 arquivos de feature (remover `<p-breadcrumb>`, ajustar layout de header de página, cards, ações)
- **API (NestJS/TypeORM):** nenhuma mudança
- **Banco (Postgres/Supabase/RLS):** nenhuma mudança
- **Shared (`libs/shared-types`, etc.):** nenhuma mudança

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Formulários com submit quebrado ao mover botões para fora do `<form>` | Usar atributo `form="form-id"` no button + `id` no form element |
| Breadcrumb piscando ao navegar (signal atualiza após render) | Chamar `set()` no construtor do componente, não em `ngOnInit` async |
| Componentes sem `ConfirmationService` quebrarão ao adicionar botão excluir | Verificar imports em cada componente de listagem |
| Grande volume de arquivos — risco de regressão | Fazer por grupo de telas: primeiro breadcrumb, depois layout, depois excluir |

## Estratégia de validação

- AC01/AC02: grep por `<p-breadcrumb` nos arquivos de feature após refatoração — deve retornar zero resultados
- AC03: testar em DevTools com viewport 375px — itens intermediários truncados, último completo
- AC04/AC05: inspecionar visualmente o header das telas de form/detalhe — botão à esquerda do título
- AC06: inspecionar telas de listagem — botão de ação à direita
- AC07: verificar que nenhum card de formulário tem `max-w-*` no styleClass
- AC08: verificar que os botões salvar/cancelar ficam no rodapé do card (sticky ao scroll)
- AC09/AC10: testar botão excluir em qualquer listagem — deve abrir confirm dialog antes de deletar
