# Refatorar Headers de Seção — PageHeaderComponent

Status: In Progress
Owner: [@william]
Criada em: 2026-05-06
Links: —

## Contexto

Atualmente cada tela monta seu próprio cabeçalho com a classe `nx-page-header` de forma ad-hoc — títulos, subtítulos, botões de ação e links de voltar são compostos diretamente no HTML de cada componente, sem padrão visual consistente.

As imagens de referência definem dois padrões distintos:

**Padrão A — Telas de listagem:**
```
[Título grande]          [Lista | Kanban*]  [Exportar ↓]  [+ Nova Entidade]
[subtítulo muted]
```
_(*) Toggle de visualização apenas em OS e Orçamentos_

**Padrão B — Telas de criação, edição e detalhe:**
```
← Voltar para [Entidade]
[Código/Nome bold] ● PILL-STATUS  ● PILL-PRIORIDADE*
[subtítulo com links contextuais]     [Imprimir]  [Enviar]  [Ação Principal]
```
_(*) Pills aparecem apenas em detalhe; form de criação não tem código/pills_

O objetivo é consolidar esses dois padrões em um único `PageHeaderComponent` reutilizável que elimine duplicação e garanta consistência visual em todas as features.

## Objetivos

- [ ] Criar `PageHeaderComponent` standalone com dois modos: `list` e `detail`
- [ ] Migrar todas as telas já implementadas para usar o novo componente
- [ ] Garantir que futuras telas usem o componente como padrão
- [ ] Suportar view-toggle (Lista | Kanban) parametrizável, habilitado apenas em OS e Orçamentos
- [ ] Suportar pills de status/prioridade com variantes de cor
- [ ] Expor slot de conteúdo para botões de ação (projeção de conteúdo Angular)

## Não-objetivos

- Não implementar o Kanban em si — o toggle apenas emite o evento de mudança de modo
- Não criar componente separado para cada tipo de ação; os botões são projetados via `ng-content`
- Não alterar lógica de negócio de nenhuma tela — apenas substituir o markup de cabeçalho
- Não cobrir a tela de Landing (`/`) nem o painel Admin (`/admin/*`) nesse refactor

## Usuários e cenários

### Cenário 1 — Desenvolvedor usa o header em tela de lista

**Dado** que estou criando uma nova tela de listagem (ex.: Fornecedores)  
**Quando** adiciono `<app-page-header variant="list" title="Fornecedores" subtitle="3 cadastrados">`  
**Então** o header renderiza com título grande à esquerda, subtítulo muted e slot de ações à direita

### Cenário 2 — Header de lista com toggle (OS e Orçamentos)

**Dado** que estou na tela de Ordens de Serviço com `[viewMode]="mode"` e `(viewModeChange)="mode=$event"`  
**Quando** o usuário clica em "Kanban"  
**Então** o componente emite `'kanban'` via `viewModeChange` e o botão fica ativo

### Cenário 3 — Desenvolvedor usa o header em tela de detalhe/edição

**Dado** que estou na tela de detalhe de OS com código `OS-2143`  
**Quando** renderizo `<app-page-header variant="detail" backLabel="Voltar para OS" backRoute="/app/os" title="OS-2143" [pills]="[...]">`  
**Então** o header exibe o link de voltar, título grande, pills inline e slot de ações à direita

### Cenário 4 — Header de criação (sem código/pills)

**Dado** que estou na tela "Novo Cliente"  
**Quando** uso `variant="detail"` sem `[pills]` e `title="Novo Cliente"`  
**Então** o header exibe só o link de voltar, o título e o subtítulo — sem pills nem código de entidade

### Cenário 5 — Pills com cores diferentes

**Dado** um OS com status "EM EXECUÇÃO" (violet) e prioridade "ALTA" (amber)  
**Quando** passo `[pills]="[{label:'EM EXECUÇÃO', color:'violet'}, {label:'ALTA', color:'amber'}]"`  
**Então** cada pill renderiza na cor correta com um dot indicator antes do label

## Regras de negócio

- RN01 (não aplicável — puramente de UI)
- O toggle Lista/Kanban só deve ser exibido quando o input `viewToggle` for fornecido (opt-in, não opt-out)
- Pills são exibidas apenas quando o array `[pills]` for não-vazio; em formulários de criação o array não é passado
- O subtítulo do detalhe pode conter fragmentos de texto linkáveis — deve ser passado via content projection (`<ng-content select="[slot=subtitle]">`) para permitir `routerLink` dentro dele

## Critérios de aceite

- **AC01** — O componente existe em `apps/web/src/app/shared/components/page-header/` e é exportado pelo `SharedModule` / importável standalone
- **AC02** — Com `variant="list"`: título grande à esquerda, subtítulo abaixo, ações à direita — sem link de voltar e sem pills
- **AC03** — Com `variant="detail"`: link de voltar acima, título em bold grande, pills inline (se fornecidas), subtítulo abaixo à esquerda, ações à direita
- **AC04** — O slot de ações (`ng-content`) aceita qualquer markup — `p-button`, `a[pButton]`, grupos de botões
- **AC05** — O toggle Lista/Kanban aparece somente quando o input `viewToggle` for fornecido; ao clicar emite `viewModeChange` com o valor selecionado
- **AC06** — Pills suportam as cores: `blue`, `violet`, `amber`, `green`, `red`, `gray` — cada cor mapeia para classes Tailwind corretas (bg-X-50, text-X-700, bg-X-500)
- **AC07** — Todas as telas listadas na seção de impacto técnico migram para o componente sem regressão visual
- **AC08** — Em mobile (< 768px), as ações ficam abaixo do título (layout column), sem overflow horizontal
- **AC09** — O subtítulo do modo `detail` suporta content projection para permitir links com `routerLink`

## Impacto técnico

- Projetos Nx afetados: `web`
- API: nenhum impacto
- Banco: nenhum impacto
- Permissões (RBAC): nenhum impacto

### Telas a migrar

| Tela | Rota | Variante | View Toggle | Pills |
|------|------|----------|-------------|-------|
| ClientListComponent | `/app/clientes` | `list` | não | não |
| ClientFormComponent | `/app/clientes/novo`, `/app/clientes/:id/editar` | `detail` | não | não |
| ClientDetailComponent | `/app/clientes/:id` | `detail` | não | status do cliente (se aplicável) |
| OsListComponent | `/app/os` | `list` | **sim** | não |
| OsFormComponent | `/app/os/nova`, `/app/os/:id/editar` | `detail` | não | não |
| OsDetailComponent | `/app/os/:id` | `detail` | não | status + prioridade |
| QuoteListComponent | `/app/orcamentos` | `list` | **sim** | não |
| QuoteFormComponent | `/app/orcamentos/novo`, `/app/orcamentos/:id/editar` | `detail` | não | não |
| QuoteDetailComponent | `/app/orcamentos/:id` | `detail` | não | status |

_Telas ainda não implementadas receberão o componente diretamente na sua criação futura._

### Shared type

```typescript
// libs/shared-types ou apps/web/src/app/shared/models/page-header.types.ts
export interface PageHeaderPill {
  label: string;
  color: 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'gray';
}

export interface PageHeaderViewToggle {
  options: Array<{ label: string; icon?: string; value: string }>;
  current: string;
}
```

## Plano de testes

- Unit: `page-header.component.spec.ts` — testa renderização condicional de pills, toggle, back link
- Integração: verificar que ClientListComponent e ClientFormComponent renderizam sem erros após migração
- E2E/manual: inspecionar visualmente cada tela migrada em desktop e mobile

## Rollout

- Feature flag? não
- Backwards compatibility: a classe CSS `nx-page-header` pode ser mantida no global styles (não quebra nada ao remover o uso dela das telas migradas)
- Migrações: nenhuma de banco
