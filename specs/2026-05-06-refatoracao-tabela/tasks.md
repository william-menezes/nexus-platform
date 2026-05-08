# Tarefas — Refatoração de Layout de Tabelas

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Confirmar escopo e ACs na spec (feito na conversa de 2026-05-06)
- [ ] TSK002 Ler `client-list.component.html` como referência visual antes de cada migração

## Implementação — Grupo A (p-card + filtro select)

- [ ] TSK010 Migrar `os-list`: substituir `<p-card>` por container padrão; mover filtro de status para toolbar; adicionar busca se ausente
- [ ] TSK011 Migrar `quote-list`: idem
- [ ] TSK012 Migrar `contract-list`: idem
- [ ] TSK013 Migrar `purchase-order-list`: idem
- [ ] TSK014 Migrar `return-list`: idem
- [ ] TSK015 Migrar `entry-list`: idem; manter os dois selects (tipo + status) no toolbar direito

## Implementação — Grupo B (p-card + busca textual)

- [ ] TSK020 Migrar `employee-list`: substituir `<p-card>` por container padrão; manter busca no toolbar esquerdo
- [ ] TSK021 Migrar `supplier-list`: idem
- [ ] TSK022 Migrar `service-list`: idem

## Implementação — Grupo C (p-card + chips de tipo)

- [ ] TSK030 Migrar `product-list`: substituir `<p-card>` por container padrão; manter chips de categoria no toolbar direito
- [ ] TSK031 Migrar `equipment-list`: idem

## Implementação — Grupo D (estrutura diferente)

- [ ] TSK040 Migrar `equipment-type-list`: sem p-card — adicionar container padrão em volta da tabela; revisar toolbar
- [ ] TSK041 Migrar `sales-list`: substituir `<p-card>` por container padrão; verificar toolbar existente

## Limpeza de imports

- [ ] TSK050 Para cada componente migrado: verificar `.ts` e remover `CardModule` se não há mais `<p-card>` no template

## Testes e qualidade

- [ ] TSK060 Rodar `npx nx build web` — sem erros de compilação TypeScript
- [ ] TSK061 Inspecionar cada tela migrada visualmente em desktop 1440px
- [ ] TSK062 Verificar mobile 375px (sem overflow horizontal, ações acessíveis)
- [ ] TSK063 Confirmar hover + ações em todas as tabelas migradas

## Entrega

- [ ] TSK070 Atualizar tabela de escopo na `spec.md` marcando cada componente como ✅
- [ ] TSK071 Marcar spec como `Done`
