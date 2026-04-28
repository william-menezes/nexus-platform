# Plano — Padronização de UI: Tailwind, Dark Mode, Breadcrumbs e Templates

Referência: `spec.md`

---

## Abordagem

São 4 operações distintas, executadas **por feature** para minimizar conflitos de merge:

| Operação | Descrição |
|---|---|
| **Extração de template** | Mover `template: \`...\`` do `.ts` para um `.html` separado e trocar para `templateUrl` |
| **Dark mode** | Trocar `bg-white` / `bg-gray-*` / `text-gray-*` por tokens do design system que respondem ao `html.dark` |
| **Breadcrumb** | Adicionar `p-breadcrumb` no topo de cada componente de lista/form/detalhe |
| **Botão padrão** | Trocar botão Tailwind customizado em `client-list` por `pButton p-button-sm` |

A execução será **feature a feature** (não componente a componente), e cada grupo de feature é um commit atômico. Isso permite revisão incremental e rollback por feature sem afetar as demais.

---

## Arquitetura e decisões

### Decisão 1 — Extração de template

Para cada componente com `template: \`...\``:
1. Criar arquivo `{component}.component.html` na mesma pasta
2. Copiar o HTML para o novo arquivo
3. No `.ts`, substituir `template: \`...\`` por `templateUrl: './{component}.component.html'`
4. Remover a importação de `CommonModule` se já não for mais necessária (alguns componentes já usam `@if`/`@for` nativos)

**Importante:** não adicionar `styleUrls` — os estilos ficam em `styles.css` global e Tailwind utilities inline.

### Decisão 2 — Dark mode (escopo completo)

**Decisão 1B:** todos os `bg-*` fixos recebem tratamento dark, não só os estruturais.

**Grupo A — Tokens do design system (substituição direta):**

| Classe atual | Substituir por | Resultado dark |
|---|---|---|
| `bg-white` | `bg-surface` | `#1E293B` |
| `bg-gray-50` / `bg-gray-100` | `bg-surface-light` | `#0F172A` |
| `border-gray-200` / `border-gray-100` | `border-surface-border` | `#334155` |
| `text-gray-900` / `text-gray-800` | `text-text` | `#F1F5F9` |
| `text-gray-600` / `text-gray-500` | `text-text-secondary` | `#94A3B8` |
| `text-gray-400` | `text-text-muted` | `#9CA3AF` |

**Grupo B — Cores semânticas de estado: adicionar variante `dark:` inline:**

| Classe atual | Adicionar |
|---|---|
| `bg-blue-50` | `dark:bg-blue-900/20` |
| `bg-green-50` | `dark:bg-green-900/20` |
| `bg-violet-50` / `bg-purple-50` | `dark:bg-violet-900/20` |
| `bg-red-50` / `bg-danger-50` | `dark:bg-red-900/20` |
| `bg-amber-50` / `bg-yellow-50` | `dark:bg-amber-900/20` |
| `text-blue-700` | `dark:text-blue-300` |
| `text-green-700` | `dark:text-green-300` |
| `text-red-700` | `dark:text-red-300` |

**Regra:** cores semânticas de texto (`text-blue-600`, `text-green-600`) **não precisam de dark variant** — já têm contraste adequado em fundo escuro. Apenas `text-*-700/800` em `bg-*-50` precisam de ajuste para legibilidade.

### Decisão 3 — Breadcrumb (padrões definitivos)

**Decisão 2B + 3B + 5A + 6B** aplicados:

**Lista** (`*-list`) — sempre inclui o módulo atual:
```typescript
readonly breadcrumbs: MenuItem[] = [{ label: 'Contratos', routerLink: '/app/contratos' }];
readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
```
```html
<p-breadcrumb [model]="breadcrumbs" [home]="homeItem" styleClass="nx-breadcrumb mb-4" />
```

**Formulário** (`*-form`) — dinâmico create/edit com `computed`:
```typescript
private readonly route = inject(ActivatedRoute);
readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

// Se o form carrega o registro em um signal `item`:
readonly breadcrumbs = computed(() => [
  { label: 'Contratos', routerLink: '/app/contratos' },
  { label: this.isEdit() ? (this.contract()?.code ?? 'Editar') : 'Novo Contrato' },
]);
```

**Detalhe** (`*-detail`):
```typescript
readonly breadcrumbs = computed(() => [
  { label: 'Contratos', routerLink: '/app/contratos' },
  { label: this.contract()?.code ?? '...' },
]);
```

**PDV** (exceção: não tem "detalhe" de registro):
```typescript
readonly breadcrumbs: MenuItem[] = [
  { label: 'Vendas', routerLink: '/app/vendas' },
  { label: 'PDV' },
];
```

**Settings shell** (Decisão 6B):
```typescript
// No settings.component.ts:
readonly breadcrumbs: MenuItem[] = [{ label: 'Configurações', routerLink: '/app/configuracoes' }];
```

Importar `BreadcrumbModule` de `primeng/breadcrumb`, `MenuItem` de `primeng/api`, `ActivatedRoute` de `@angular/router`.

### Decisão 4 — Botão padrão

Único arquivo afetado: `client-list.component.html`. Substituir os 2 botões Tailwind:

```html
<!-- Antes: -->
<a routerLink="novo" class="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 ...">
  <i class="pi pi-plus text-xs"></i>
  Novo Cliente
</a>

<!-- Depois: -->
<a routerLink="novo" pButton label="Novo Cliente" icon="pi pi-plus" class="p-button-sm"></a>
```

### Decisão 5 — Mobile-first

Para cada componente revisado, verificar:
- Grids com `grid-cols-N` → adicionar breakpoint: `grid-cols-1 md:grid-cols-2 lg:grid-cols-N`
- Tabelas longas → adicionar `overflow-x-auto` no wrapper
- Inputs → garantir `w-full` no mobile
- Ações de formulário (`nx-form-actions`) → `flex-wrap` já no global CSS (ok)

---

## Mudanças por camada

### Web (Angular)
- **31 arquivos `.ts`** (features): remover `template`, adicionar `templateUrl`
- **31 arquivos `.html` novos**: criados com HTML extraído + dark mode Grupo A+B + breadcrumb dinâmico
- **3 arquivos `.ts`** (admin inline): `admin-dashboard`, `tenant-list`, `tenant-detail` — extrair template
- **15 arquivos `.html` existentes**: adicionar breadcrumb + dark mode Grupo B
- **`client-list.component.html`**: trocar botão Tailwind → pButton
- Todo `.ts` que recebe breadcrumb: adicionar `BreadcrumbModule`, `MenuItem`, `ActivatedRoute` nos imports

### API / Banco / Shared
- Nenhuma mudança.

---

## Ordem de execução por feature (grupos de commit)

```
Grupo 1:  audit-logs                          (1 comp.)
Grupo 2:  suppliers                           (2 comps.)
Grupo 3:  services-catalog                    (2 comps.)
Grupo 4:  employees                           (3 comps.)
Grupo 5:  equipments                          (3 comps.)
Grupo 6:  contracts                           (3 comps.)
Grupo 7:  returns                             (3 comps.)
Grupo 8:  purchase-orders                     (3 comps.)
Grupo 9:  financial                           (5 comps.)
Grupo 10: settings                            (4 comps. — shell incluso com breadcrumb)
Grupo 11: quotes (list + detail inline)       (2 comps.)
Grupo 12: Grupo B — breadcrumb/dark + botão   (10 comps. já têm .html)
Grupo 13: admin — extrair + breadcrumb/dark   (3 comps: admin-dashboard, tenant-list, tenant-detail)
```

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Extração de template quebra binding Angular | Baixa | `npx nx build web` após cada grupo |
| `bg-surface` não está disponível em todos os contextos | Baixa | Já adicionado no `tailwind.config.js` (spec `refatoracao-tema`) |
| Breadcrumb com `routerLink` relativo quebrando rota | Média | Usar sempre paths absolutos `/app/...` nas migas |
| Componente perde `CommonModule` necessário por `*ngIf` em template antigo | Baixa | Na extração, verificar se tem `*ngIf`/`*ngFor` legados; se sim, manter `CommonModule` |
| Dark mode em `p-datatable` (PrimeNG não responde a `html.dark` por padrão) | Alta | PrimeNG Aura preset já configurado com `darkModeSelector: '.dark'` em `app.config.ts` — OK |

---

## Estratégia de validação por AC

| AC | Como verificar |
|---|---|
| AC01 | `grep -r "template: \`" apps/web/src/app/features` → zero resultados |
| AC02 | `npx nx build web` sem erros |
| AC03 | `grep -r "bg-white\|bg-gray-50\|bg-gray-100" apps/web/src/app/features --include="*.html"` → zero sem `dark:` no mesmo elemento |
| AC04 | `grep -r "p-breadcrumb" apps/web/src/app/features` → 40+ resultados |
| AC05 | `grep -r "inline-flex.*bg-primary" apps/web/src/app/features` → zero resultados |
| AC06 | Chrome DevTools → responsive → 375px → navegar em `/app/contratos`, `/app/clientes`, `/app/os` |
| AC07 | Toggle `document.documentElement.classList.toggle('dark')` em `/app/dashboard` → sem bg-white visível |
