# Padronização de UI: Tailwind, Dark Mode, Breadcrumbs e Separação de Templates

Status: Done
Owner: William
Criada em: 2026-04-27
Links: [auditoria realizada em 2026-04-27]

## Contexto

Uma auditoria do frontend identificou 4 classes de inconsistências nos ~60 componentes do projeto:

1. **Templates inline (67% dos componentes):** 31 de 46 componentes têm HTML dentro do `.ts` via `template: \`...\``. Isso dificulta leitura, diff em PR, e suporte de ferramentas de formatação HTML.

2. **Dark mode ausente:** Cores hardcoded (`bg-white`, `bg-gray-*`, `text-gray-900`) sem variante `dark:`. O toggle `html.dark` existe, mas a maioria das telas ignora o modo escuro.

3. **Breadcrumbs inconsistentes:** Apenas 3 dos ~40 componentes de formulário/detalhe têm `p-breadcrumb`. Todos os outros não têm navegação contextual.

4. **Botão de ação primária inconsistente:** `client-list` usa botão Tailwind grande customizado; todos os demais usam `pButton` com `class="p-button-sm"`. O padrão enxuto do PrimeNG deve ser o único.

Adicionalmente, nem todos os componentes seguem **mobile-first**: alguns têm `grid-cols-*` fixo sem breakpoint, inputs sem `w-full` no mobile, etc.

## Objetivos

- [ ] Extrair todos os templates inline para arquivos `.html` separados (31 componentes)
- [ ] Adicionar variantes `dark:` em todas as ocorrências de cor hardcoded (bg-white, bg-gray-*, text-gray-*, border-gray-*)
- [ ] Adicionar `p-breadcrumb` em todos os componentes de lista, form e detalhe
- [ ] Substituir o botão Tailwind customizado do `client-list` por `pButton p-button-sm`
- [ ] Garantir que todos os layouts são mobile-first (sem grid fixo sem breakpoint, inputs full-width)
- [ ] Padronizar o padrão de botão de ação primária: `pButton icon="pi pi-plus" label="Nova X" class="p-button-sm"` em anchor ou button

## Não-objetivos

- Redesign de telas (sem alterar hierarquia de informação, campos ou fluxo)
- Criação de novos componentes compartilhados
- Alterar lógica de negócio, services ou chamadas de API
- Alterar autenticação, rotas ou guards
- Alterar componentes de auth (login, signup, company-setup) — foco exclusivo em `/app`
- Alterar landing page

## Padrão de referência

### Botão de ação primária (sempre assim)
```html
<!-- Em anchor (navegação): -->
<a routerLink="novo" pButton label="Nova OS" icon="pi pi-plus" class="p-button-sm"></a>

<!-- Em button (ação): -->
<button pButton label="Salvar" icon="pi pi-check" class="p-button-sm"></button>
```

### Breadcrumb (sempre no topo da page, antes do conteúdo)
```typescript
// No .ts:
readonly breadcrumbs = [{ label: 'Contratos', routerLink: '/app/contratos' }];
readonly homeItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
```
```html
<!-- No .html, logo abaixo de p-toast/p-confirmDialog: -->
<p-breadcrumb [model]="breadcrumbs" [home]="homeItem" styleClass="nx-breadcrumb mb-4" />
```

### Dark mode (sempre usar tokens do design system, nunca bg-white hardcoded)
```html
<!-- ❌ Errado: -->
<div class="bg-white rounded-xl border border-gray-200">

<!-- ✅ Correto: -->
<div class="bg-surface rounded-xl border border-surface-border dark:bg-surface">
```
Os tokens `bg-surface`, `text-text`, `text-text-secondary`, `bg-surface-border` já estão configurados no `tailwind.config.js` apontando para `var(--bg-card)`, `var(--text-primary)`, etc. que têm variantes dark em `styles.css`.

## Usuários e cenários

### Cenário 1 — Usuário usa modo escuro no sistema operacional

**Dado** que o usuário ativou o dark mode no SimplificaOS  
**Quando** navega para qualquer tela em `/app`  
**Então** todos os backgrounds, textos e borders refletem a paleta escura sem elementos brancos "fantasmas"

### Cenário 2 — Usuário em celular navega para detalhes de um contrato

**Dado** que o usuário acessa `/app/contratos/:id` em um smartphone  
**Quando** a tela carrega  
**Então** o layout é usável sem scroll horizontal, os campos empilham verticalmente e o breadcrumb mostra o contexto navegacional

### Cenário 3 — Desenvolvedor mantém um componente

**Dado** que um desenvolvedor abre `contract-form.component.ts` no editor  
**Quando** precisa editar o template  
**Então** o template está em `contract-form.component.html` separado, com realce de sintaxe correto e diff legível

## Regras de negócio

- Nenhuma regra de domínio envolvida — mudança puramente estrutural e visual
- A ordem dos campos e a hierarquia de informação dos formulários **não deve ser alterada**
- Dados vinculados por `[ngModel]`, `formControlName` ou `[(ngModel)]` devem permanecer intactos após extração

## Critérios de aceite

- AC01: Todos os 31 componentes com template inline têm `.html` separado; zero `template: \`` nos componentes de features
- AC02: `npx nx build web` passa sem erros após todas as extrações
- AC03: Nenhuma ocorrência de `bg-white`, `bg-gray-50`, `bg-gray-100` em templates de features sem variante `dark:` correspondente
- AC04: Todos os componentes de lista, form e detalhe em `/app` têm `p-breadcrumb` configurado
- AC05: Zero botões com `class="inline-flex.*bg-primary"` customizado — todos usam `pButton`
- AC06: Em viewport 375px, todas as telas em `/app` são usáveis sem scroll horizontal
- AC07: Toggle de dark mode em `/app/dashboard` não exibe elementos brancos visíveis

## Impacto técnico

- Projetos Nx afetados: `web` apenas
- API: nenhum impacto
- Banco: nenhum impacto
- Permissões (RBAC): nenhum impacto

## Componentes afetados (inventário completo)

### Grupo A — Extrair template + breadcrumb + dark mode (31 componentes)
| Feature | Componente | Tem .html? | Tem breadcrumb? |
|---|---|---|---|
| contracts | contract-list | ❌ | ❌ |
| contracts | contract-form | ❌ | ❌ |
| contracts | contract-detail | ❌ | ❌ |
| employees | employee-list | ❌ | ❌ |
| employees | employee-form | ❌ | ❌ |
| employees | invite-employee | ❌ | ❌ |
| equipments | equipment-list | ❌ | ❌ |
| equipments | equipment-form | ❌ | ❌ |
| equipments | equipment-type-list | ❌ | ❌ |
| financial | entry-list | ❌ | ❌ |
| financial | entry-form | ❌ | ❌ |
| financial | entry-detail | ❌ | ❌ |
| financial | cash-session | ❌ | ❌ |
| financial | chart-of-accounts | ❌ | ❌ |
| purchase-orders | purchase-order-list | ❌ | ❌ |
| purchase-orders | purchase-order-form | ❌ | ❌ |
| purchase-orders | purchase-order-detail | ❌ | ❌ |
| returns | return-list | ❌ | ❌ |
| returns | return-form | ❌ | ❌ |
| returns | return-detail | ❌ | ❌ |
| services-catalog | service-list | ❌ | ❌ |
| services-catalog | service-form | ❌ | ❌ |
| settings | settings | ❌ | ❌ |
| settings | custom-statuses | ❌ | ❌ |
| settings | general-settings | ❌ | ❌ |
| settings | permissions | ❌ | ❌ |
| suppliers | supplier-list | ❌ | ❌ |
| suppliers | supplier-form | ❌ | ❌ |
| quotes | quote-list | ❌ | ❌ |
| quotes | quote-detail | ❌ | ❌ |
| audit-logs | audit-logs | ❌ | ❌ |

### Grupo B — Só breadcrumb + dark mode (já têm .html separado)
| Feature | Componente | Tem breadcrumb? |
|---|---|---|
| dashboard | dashboard | ❌ |
| clients | client-list | ❌ |
| clients | client-detail | ❌ |
| service-orders | os-list | ❌ |
| service-orders | os-detail | ❌ |
| inventory | product-list | ❌ |
| finance | sales-list | ❌ |
| finance | pdv | ❌ |
| finance | dre | ❌ |
| admin | admin-dashboard | ❌ |

## Plano de testes

- Unit: não aplicável
- Integração: não aplicável
- E2E/manual: inspeção visual em 5 telas representativas (1 lista, 1 form, 1 detalhe, dashboard, 1 settings) em modo claro e escuro + viewport 375px

## Rollout

- Feature flag? não — mudança visual e estrutural, sem risco de dados
- Backwards compatibility: manter `templateUrl` apontando para `.html` recém-criado (sem quebrar injeção de Angular)
- Migrações: nenhuma
