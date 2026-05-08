# Tarefas — Refatoração do Client Detail

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Ler componente atual (`client-detail.component.ts` + `.html`) e confirmar quais signals já existem
- [ ] TSK002 Confirmar com usuário as 4 dúvidas abertas na spec (KPIs, histórico, abas Vendas/Equipamentos, ações rápidas)
- [ ] TSK003 [PREENCHER] Se endpoint de summary necessário: criar no backend e atualizar `ClientsService`

## Frontend — TypeScript

- [ ] TSK010 Adicionar signal `activeTab = signal<string>('historico')` e método `setTab(tab: string)`
- [ ] TSK011 Adicionar computed signals: `openOrders`, `closedOrders` (filtros sobre `serviceOrders()`)
- [ ] TSK012 Adicionar computed signal `timelineItems` — agrega OS + quotes + evento de cadastro, ordena por data desc
- [ ] TSK013 [PREENCHER] Adicionar signals de KPIs financeiros (aguarda Dúvida 1)
- [ ] TSK014 Garantir que `CommonModule` / `DatePipe` e `CurrencyPipe` estão nos imports

## Frontend — Template (reescrita completa)

- [ ] TSK020 Implementar hero-card: avatar inicial, nome, pills PF/PJ + Ativo, linha de contatos
- [ ] TSK021 Implementar botões de ação no hero-card: ☎, WhatsApp, Email, Editar, + Nova OS
- [ ] TSK022 Implementar KPI bar (4 colunas, fonte mono, label uppercase)
- [ ] TSK023 Implementar barra de abas com contagem (Histórico, OS, Orçamentos, [Vendas], [Equipamentos])
- [ ] TSK024 Implementar aba Histórico: timeline com ícone, código, pill de status, data, subtexto
- [ ] TSK025 Implementar aba Ordens de Serviço: lista com código, status pill, data, link para OS detail
- [ ] TSK026 Implementar aba Orçamentos: lista com código, status pill, data, link para orçamento detail
- [ ] TSK027 [PREENCHER] Implementar abas Vendas e Equipamentos (aguarda Dúvida 3)
- [ ] TSK028 Implementar sidebar "Detalhes": cidade, endereço, observações com labels uppercase
- [ ] TSK029 Implementar sidebar "Ações rápidas": links de navegação + "Excluir cliente" com cor bad
- [ ] TSK030 Layout responsivo: `grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6`
- [ ] TSK031 Estado de loading e estado de erro (manter os existentes, reestilizar)
- [ ] TSK032 Substituir todos os `style=""` inline por classes Tailwind

## Qualidade

- [ ] TSK040 Inspecionar visualmente em desktop 1440px (comparar com screenshot de referência)
- [ ] TSK041 Inspecionar em mobile 375px (sidebar colapsa, hero-card responsivo)
- [ ] TSK042 Confirmar que `grep style= client-detail.component.html` retorna vazio
- [ ] TSK043 Rodar `npx nx build web` sem erros

## Entrega

- [ ] TSK050 Atualizar spec.md: status → Done, preencher [PREENCHER]s resolvidos
