# Refatoração de Layout de Tabelas — Padronização de Listagens

Status: Done
Owner: [@william]
Criada em: 2026-05-06
Links: Referência visual: `client-list.component.html` (padrão ouro)

## Contexto

As telas de listagem do sistema usam estruturas visuais inconsistentes: algumas envolvem a tabela em `<p-card>`, outras em `<div>` simples, os toolbars de busca/filtro não têm padrão definido, e o comportamento de hover nas linhas varia. O componente `ClientListComponent` foi refatorado manualmente e se tornou o padrão de referência visual. O objetivo desta spec é propagar esse padrão para todos os demais componentes de listagem.

## Objetivos

- [ ] Padronizar o container externo das tabelas (substituir `<p-card>` pelo div com classe `rounded-xl border border-surface-border bg-surface-elevated shadow-sm overflow-hidden`)
- [ ] Padronizar o toolbar interno (busca à esquerda, filtros/chips à direita, separados por `border-b`)
- [ ] Padronizar `<p-table>` com `styleClass="nx-data-table p-datatable-sm"` em todos os componentes
- [ ] Padronizar comportamento de hover nas linhas: `class="group"` no `<tr>`, ações com `opacity-0 group-hover:opacity-100`
- [ ] Padronizar o rodapé paginador com "Mostrando X de Y" no slot `paginatorleft`
- [ ] Padronizar o empty state com `.nx-table-empty`, `.nx-table-empty__icon`, `.nx-table-empty__title`, `.nx-table-empty__description`

## Não-objetivos

- Não alterar lógica de negócio, serviços, DTOs nem API
- Não adicionar novas colunas ou funcionalidades
- Não migrar formulários ou telas de detalhe (escopo separado)
- Não alterar `client-list` (já está no padrão)
- Não criar um componente reutilizável de tabela (padronização via markup + classes CSS)
- Não migrar componentes de admin (`tenant-list`, `plan-list`, `coupon-list`) nesta iteração — escopo separado

## Usuários e cenários

### Cenário 1 — Usuário navega para uma tela de listagem

**Dado** que o usuário está autenticado e navega para qualquer tela de listagem  
**Quando** a tela carrega  
**Então** a tabela aparece com container visual consistente com o padrão `client-list`:
  container branco com borda sutil e shadow, toolbar com busca + filtros, linhas com hover e ações visíveis

### Cenário 2 — Hover em linha da tabela

**Dado** que a tabela exibe registros  
**Quando** o usuário passa o mouse sobre uma linha  
**Então** a linha recebe destaque visual e os ícones de ação (ver, editar, excluir) aparecem gradualmente

### Cenário 3 — Tabela vazia

**Dado** que não há registros para exibir  
**Quando** a tabela renderiza  
**Então** aparece o empty state centralizado com ícone, título e descrição no padrão `.nx-table-empty`

## Regras de negócio

- Sem impacto — esta spec é puramente de apresentação (HTML/CSS)

## Critérios de aceite

- AC01 Todos os componentes de listagem no escopo usam o container `rounded-xl border border-surface-border bg-surface-elevated shadow-sm overflow-hidden` em vez de `<p-card>`
- AC02 O toolbar interno de cada componente segue o layout: busca/filtros dentro de `div.flex.items-center.justify-between` com `border-b border-surface-border`
- AC03 Todas as tabelas usam `styleClass="nx-data-table p-datatable-sm"` (sem outras classes de tabela)
- AC04 Linhas de todas as tabelas têm `class="group"` e ações com `opacity-0 group-hover:opacity-100 transition-opacity`
- AC05 Todas as tabelas têm slot `paginatorleft` com "Mostrando X de Y" (usa `formatTableSummary`)
- AC06 Todas as tabelas têm empty state usando as classes `.nx-table-empty` padronizadas
- AC07 Nenhum componente migrado tem `<p-card>` envolvendo a tabela
- AC08 `nx build web` sem erros após migração de todos os componentes do escopo

## Escopo de migração

| Componente | Arquivo | Status |
|---|---|---|
| `client-list` | `clients/components/client-list/` | ✅ Referência — não migrar |
| `os-list` | `service-orders/components/os-list/` | ⏳ Pendente |
| `quote-list` | `quotes/components/quote-list/` | ⏳ Pendente |
| `contract-list` | `contracts/components/contract-list/` | ⏳ Pendente |
| `product-list` | `inventory/components/product-list/` | ⏳ Pendente |
| `employee-list` | `employees/components/employee-list/` | ⏳ Pendente |
| `supplier-list` | `suppliers/components/supplier-list/` | ⏳ Pendente |
| `service-list` | `services-catalog/components/service-list/` | ⏳ Pendente |
| `equipment-list` | `equipments/components/equipment-list/` | ⏳ Pendente |
| `equipment-type-list` | `equipments/components/equipment-type-list/` | ⏳ Pendente |
| `entry-list` | `financial/components/entry-list/` | ⏳ Pendente |
| `purchase-order-list` | `purchase-orders/components/purchase-order-list/` | ⏳ Pendente |
| `return-list` | `returns/components/return-list/` | ⏳ Pendente |
| `sales-list` | `finance/components/sales-list/` | ⏳ Pendente |

## Impacto técnico

- Projetos Nx afetados: `web`
- API: nenhum
- Banco: nenhum
- Permissões (RBAC): nenhum
- Observabilidade: nenhum

## Plano de testes

- Unit: não aplicável (puramente visual)
- Integração: não aplicável
- E2E/manual: inspecionar cada tela em desktop 1440px e mobile 375px após migração

## Rollout

- Feature flag: não
- Backwards compatibility: não aplicável (apenas HTML/CSS)
- Migrações: não aplicável
