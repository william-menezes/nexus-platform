# Checklist — Refatoração de Layout de Tabelas

Criada em: 2026-05-06
Referência: `spec.md`

## Produto

- [x] CA01 Todos os 14 componentes no escopo usam container `rounded-xl border ...` em vez de `<p-card>`
- [x] CA02 Toolbar interno de cada tabela: busca à esquerda + filtros/chips à direita, separados por `border-b`
- [x] CA03 Todas as tabelas: `styleClass="nx-data-table p-datatable-sm"`
- [x] CA04 Linhas: `class="group"` no `<tr>`, ações com `opacity-0 group-hover:opacity-100`
- [x] CA05 Slot `paginatorleft` com "Mostrando X de Y" em todas as tabelas
- [x] CA06 Empty state com `.nx-table-empty` em todas as tabelas
- [x] CA07 Nenhum `<p-card>` envolvendo tabela nos componentes migrados

## UX / Visual

- [x] UX01 Desktop 1440px: layout consistente com client-list em todas as telas migradas
- [ ] UX02 Mobile 375px: sem overflow horizontal; toolbar quebra para linha de baixo corretamente
- [ ] UX03 Hover: ações aparecem suavemente em todas as tabelas migradas

## Segurança / Tenancy

- [x] SEC01 Nenhuma lógica de dado ou auth alterada — apenas HTML/CSS

## Qualidade

- [x] QLT01 `CardModule` removido de todos os `.ts` onde não há mais `<p-card>`
- [x] QLT02 `npx nx build web` sem erros de compilação TypeScript
- [x] QLT03 Sem warnings de template (NG8113 import não usado)
