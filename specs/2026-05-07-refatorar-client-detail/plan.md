# Plano — Refatoração do Client Detail

Referência: `spec.md`

## Abordagem

Refatoração puramente de frontend (`apps/web`). O componente atual carrega dados via `clientsService.getById()`, `serviceOrders` e `quotes` — mantemos essas chamadas e derivamos os KPIs client-side com signals computed. A estrutura de abas é implementada com `signal<string>` (tab ativa) + `@switch` no template, sem `<p-tabView>` para manter controle total de padding/styling.

Se o backend precisar de endpoint de summary (Dúvida 1), esse endpoint será adicionado ao `ClientsService` e chamado no `ngOnInit`.

## Arquitetura e decisões

- **Tabs:** `signal<string>('historico')` + switch de template. Evita o overhead de `<p-tabView>` e dá controle total de layout.
- **KPIs derivados:** `computed(() => this.serviceOrders().filter(o => ...))` para OS abertas/concluídas. Faturado e Saldo dependem de resposta da Dúvida 1.
- **Timeline (Histórico):** agregar client-side `serviceOrders`, `quotes` e `{ type: 'created', date: client.createdAt }` → ordenar por data desc → mapear para `TimelineItem[]`.
- **Avatar:** `<div>` com initial do nome (primeira letra), estilos Tailwind. Sem upload nesta fase.
- **Ações rápidas:** links de navegação com `queryParams: { clientId: client.id }` para pré-preencher forms.
- **Layout:** `grid grid-cols-1 lg:grid-cols-[1fr_300px]` — main + sidebar colapsam em mobile.

## Mudanças por camada

- **Web (Angular):**
  - `client-detail.component.html` — reescrita completa
  - `client-detail.component.ts` — adicionar signals: `activeTab`, KPIs computed, `timelineItems` computed
  - `clients.service.ts` — [PREENCHER] possível endpoint `/clients/:id/summary` (Dúvida 1)
  - Sem novos módulos Angular

- **API (NestJS):** [PREENCHER — aguarda Dúvida 1 e 2]
- **Banco (Postgres):** sem mudanças
- **Shared (`libs/shared-types`):** possível adição de `ClientSummary` type se endpoint criado

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| KPIs incorretos calculados client-side | Calcular com filtros explícitos; validar visualmente vs dados reais |
| Timeline com muitos itens degrada performance | Limitar a 20 itens mais recentes (sem paginação nesta fase) |
| Sidebar overflow em telas pequenas | Testar em 375px; usar `overflow-y-auto` no sidebar se necessário |

## Estratégia de validação

- AC01: inspecionar hero-card com cliente PF e PJ
- AC02-AC03: clicar em Nova OS e Editar, verificar URL/pre-fill
- AC04: conferir KPIs com dados reais do banco
- AC05-AC07: navegar pelas abas
- AC08-AC09: verificar sidebar
- AC10: confirmar soft delete via rede (status 200, deleted_at set)
- AC11: DevTools mobile 375px
- AC12: `grep style= client-detail.component.html` deve retornar vazio
