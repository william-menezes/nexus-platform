# Tarefas — Refatorar Headers de Seção — PageHeaderComponent

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Confirmar escopo e ACs na spec (done na conversa de 2026-05-06)
- [ ] TSK002 Verificar quais telas já estão implementadas e precisam de migração imediata

## Implementação — Componente

- [ ] TSK010 Criar `apps/web/src/app/shared/models/page-header.types.ts` com `PageHeaderVariant`, `PageHeaderPill`, `PageHeaderPillColor`, `PageHeaderViewToggleOption`
- [ ] TSK011 Criar `page-header.component.ts` standalone com todos os `@Input()` e `@Output()` definidos no plan
- [ ] TSK012 Implementar método `pillClasses(color)` com mapa estático de classes Tailwind (evitar purge)
- [ ] TSK013 Criar `page-header.component.html` — modo `list`: layout com título/subtítulo à esquerda + toggle (opcional) + slot de ações à direita
- [ ] TSK014 Criar `page-header.component.html` — modo `detail`: link de voltar + título + pills inline + subtitle slot + slot de ações
- [ ] TSK015 Garantir responsividade mobile (< 768px): ações vão para baixo do título com `flex-col sm:flex-row`

## Implementação — Migração de telas

- [ ] TSK020 Migrar `ClientListComponent`: substituir `<div class="nx-page-header">` + botões inline por `<app-page-header variant="list">` + `[actions]` slot
- [ ] TSK021 Migrar `ClientFormComponent`: substituir bloco de page-header por `<app-page-header variant="detail">` com `backLabel`, `backRoute`, `title`, `subtitle` + `[actions]` slot com botões Cancelar/Salvar e novo/Salvar
- [ ] TSK022 Migrar `OsListComponent` (se implementado): `variant="list"` + `viewToggleOptions` + `[actions]` slot com "+ Nova OS"
- [ ] TSK023 Migrar `OsFormComponent` (se implementado): `variant="detail"` sem pills
- [ ] TSK024 Migrar `OsDetailComponent` (se implementado): `variant="detail"` com pills de status e prioridade
- [ ] TSK025 Migrar `QuoteListComponent` (se implementado): `variant="list"` + `viewToggleOptions` + `[actions]` slot
- [ ] TSK026 Migrar `QuoteFormComponent` (se implementado): `variant="detail"` sem pills
- [ ] TSK027 Migrar `QuoteDetailComponent` (se implementado): `variant="detail"` com pill de status

## Testes e qualidade

- [ ] TSK030 Escrever `page-header.component.spec.ts`:
  - Renderiza título e subtítulo no modo `list`
  - Não renderiza link de voltar no modo `list`
  - Renderiza link de voltar no modo `detail`
  - Renderiza pills corretamente quando fornecidas
  - Não renderiza pills quando array vazio/undefined
  - Toggle aparece apenas quando `viewToggleOptions` é fornecido
  - `viewModeChange` emite ao clicar em opção do toggle
  - Pill com cor `violet` tem classes `bg-violet-50 text-violet-700`
- [ ] TSK031 Rodar `npx nx lint web` — zero erros
- [ ] TSK032 Rodar `npx nx test web` — zero falhas
- [ ] TSK033 Build `npx nx build web` — sem erros de compilação

## Entrega

- [ ] TSK040 Inspecionar visualmente cada tela migrada (desktop 1440px e mobile 375px) contra imagens de referência
- [ ] TSK041 Confirmar que toggle de view emite evento corretamente (testar no DevTools ou unit test)
- [ ] TSK042 Atualizar este `tasks.md` com status de cada tela migrada
- [ ] TSK043 Marcar spec como `Status: Done`
