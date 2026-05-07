# Plano — Refatorar Headers de Seção — PageHeaderComponent

Referência: `spec.md`

## Abordagem

Criar um único `PageHeaderComponent` standalone com dois modos via `variant` input (`'list'` | `'detail'`). A escolha de um componente único (ao invés de dois) simplifica os imports e mantém as interfaces de tipo centralizadas. A diferença de layout entre os modos é grande o suficiente para usar `@if (variant === ...)` no template, mas pequena o suficiente para não justificar componentes separados.

As ações (botões à direita) são projetadas via `<ng-content select="[actions]">` — isso evita Input hell para configurar botões (labels, icons, severities, callbacks diferentes por tela) e mantém a flexibilidade de colocar qualquer combinação de `p-button`, `a[pButton]`, dropdowns etc.

O subtítulo do modo `detail` usa um segundo slot de content projection (`<ng-content select="[subtitle]">`) para suportar links reativos (`routerLink`), enquanto o subtítulo do modo `list` aceita string simples via `@Input`.

## Arquitetura e decisões

### Interface de tipos

```typescript
// apps/web/src/app/shared/models/page-header.types.ts
export type PageHeaderVariant = 'list' | 'detail';
export type PageHeaderPillColor = 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'gray';

export interface PageHeaderPill {
  label: string;
  color: PageHeaderPillColor;
}

export interface PageHeaderViewToggleOption {
  label: string;
  icon?: string;   // classe PrimeIcons
  value: string;
}
```

### Inputs e Outputs do componente

```typescript
@Input() variant: PageHeaderVariant = 'list';

// Modo list e detail
@Input({ required: true }) title!: string;
@Input() subtitle?: string;             // string simples (modo list + detail fallback)

// Modo detail
@Input() backLabel?: string;            // "Voltar para OS"
@Input() backRoute?: string | string[]; // "/app/os" ou ['/app/os']
@Input() pills?: PageHeaderPill[];

// Modo list — view toggle (opcional, apenas OS e Orçamentos)
@Input() viewToggleOptions?: PageHeaderViewToggleOption[];
@Input() viewMode?: string;
@Output() viewModeChange = new EventEmitter<string>();
```

### Template structure

```
variant=list:
  <div class="nx-page-header">
    <div>                          ← left: title + subtitle
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
    <div class="flex gap-2">       ← right: toggle? + ng-content[actions]
      @if (viewToggleOptions) { ... toggle buttons ... }
      <ng-content select="[actions]" />
    </div>
  </div>

variant=detail:
  <div class="nx-page-header-detail flex flex-col gap-0.5 mb-6">
    <a [routerLink]="backRoute">← {{ backLabel }}</a>
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h1>{{ title }}</h1>
          @for (pill of pills) { <pill-chip> }
        </div>
        <div class="subtitle">
          @if (subtitle) { <p>{{ subtitle }}</p> }
          <ng-content select="[subtitle]" />
        </div>
      </div>
      <div class="flex gap-2 shrink-0">
        <ng-content select="[actions]" />
      </div>
    </div>
  </div>
```

### Pill color map (Tailwind)

| Color | bg | text | dot |
|-------|----|------|-----|
| blue | bg-blue-50 | text-blue-700 | bg-blue-500 |
| violet | bg-violet-50 | text-violet-700 | bg-violet-500 |
| amber | bg-amber-50 | text-amber-700 | bg-amber-500 |
| green | bg-emerald-50 | text-emerald-700 | bg-emerald-500 |
| red | bg-red-50 | text-red-700 | bg-red-500 |
| gray | bg-slate-100 | text-slate-600 | bg-slate-400 |

O mapeamento é feito com um método `pillClasses(color)` no componente (não com classes dinâmicas interpoladas — assim o Tailwind não faz purge).

### View toggle

Renderizado com `<div class="flex rounded-md border border-surface-border overflow-hidden">` + botões internos. O botão com `value === viewMode` recebe classes de ativo (bg-surface-elevated, texto não-muted). Emite `viewModeChange` com o novo valor ao clicar.

### Localização do arquivo

```
apps/web/src/app/shared/components/page-header/
  page-header.component.ts
  page-header.component.html
  page-header.component.spec.ts
```

Importado diretamente nos componentes standalone que o usam (sem barrel/NgModule).

## Mudanças por camada

- **Web (Angular/PrimeNG/Tailwind):**
  - Criar `PageHeaderComponent` com o template e lógica descritos
  - Criar `apps/web/src/app/shared/models/page-header.types.ts` com as interfaces
  - Migrar `ClientListComponent`: substituir `<div class="nx-page-header">` por `<app-page-header variant="list">`
  - Migrar `ClientFormComponent`: substituir o bloco de page-header por `<app-page-header variant="detail">`
  - Idem para `OsListComponent`, `OsFormComponent`, `OsDetailComponent`, `QuoteListComponent`, `QuoteFormComponent`, `QuoteDetailComponent` — quando/se já implementados
- **API (NestJS/TypeORM):** nenhuma alteração
- **Banco (Postgres/Supabase/RLS):** nenhuma alteração
- **Shared (`libs/shared-types`):** As interfaces `PageHeaderPill`, `PageHeaderVariant` ficam no `apps/web` (são puramente de UI), não em `libs/shared-types` (que é fullstack)

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Tailwind purge remove classes de pill geradas dinamicamente | Alta | Usar mapa de classes estáticas (`pillClasses()` retorna string fixa por cor) |
| Content projection vazia quebra layout | Baixa | Verificar `@ContentChildren` ou usar `<ng-content>` simples — slot vazio não ocupa espaço |
| Mobile overflow nos botões de ação | Média | Testar breakpoint `< 768px`, usar `flex-wrap` e `flex-col` no mobile |
| Regressão visual após migração | Baixa | Migrar uma tela de cada vez, confirmar visualmente antes de seguir |

## Estratégia de validação

- **AC01**: verificar que o arquivo existe e é importável — build sem erros
- **AC02–AC03**: inspeção visual lado a lado com as imagens de referência
- **AC04**: testar com diferentes combinações de `actions` (1 botão, 3 botões, botão + link)
- **AC05**: clicar no toggle na tela de OS — verificar que `viewModeChange` emite e que o botão ativo muda
- **AC06**: testar todas as 6 cores com pill sample no componente spec
- **AC07**: navegar em cada tela migrada e comparar com o padrão esperado
- **AC08**: redimensionar janela para 375px — verificar layout sem overflow
- **AC09**: usar `<a routerLink="..." slot="subtitle">` — verificar que navega corretamente
