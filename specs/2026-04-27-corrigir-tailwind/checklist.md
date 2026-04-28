# Checklist: Padronização de UI — Tailwind, Dark Mode, Breadcrumbs e Templates

Criada em: 2026-04-27
Referência: `spec.md`

## Produto

- [ ] CA01 Critérios de aceite (AC01–AC07) revisados e verificáveis
- [ ] CA02 Não-objetivos explícitos (sem redesign, sem lógica de negócio, sem auth/landing)

## Estrutura de arquivos

- [x] EST01 Zero `template: \`` em componentes de features (`grep` → zero resultados)
- [x] EST02 Todo componente com `.html` tem `templateUrl` correspondente no `.ts`
- [x] EST03 Nenhum arquivo `.html` órfão sem `.ts` correspondente

## Visual — Dark mode

- [x] DRK01 Zero `bg-white` / `bg-gray-50` / `bg-gray-100` sem `dark:` em templates de features
- [ ] DRK02 Toggle `html.dark` em `/app/dashboard` sem elementos brancos visíveis
- [ ] DRK03 Toggle `html.dark` em `/app/contratos` sem elementos brancos visíveis
- [ ] DRK04 Toggle `html.dark` em `/app/clientes` sem elementos brancos visíveis

## Visual — Breadcrumbs

- [x] BRD01 Todo componente de lista em `/app` tem `p-breadcrumb` com `homeItem`
- [x] BRD02 Todo componente de form tem `p-breadcrumb` com link para a lista + label do form
- [x] BRD03 Todo componente de detalhe tem `p-breadcrumb` com código/nome do registro

## Visual — Botões e consistência

- [ ] BTN01 Zero botões com `class="inline-flex.*bg-primary"` customizado em features
- [ ] BTN02 Todos os botões de ação primária usam `pButton p-button-sm` com `icon` + `label`

## Mobile-first

- [ ] MOB01 Viewport 375px em `/app/contratos` — sem scroll horizontal
- [ ] MOB02 Viewport 375px em `/app/clientes` — sem scroll horizontal
- [ ] MOB03 Viewport 375px em `/app/os` — sem scroll horizontal
- [ ] MOB04 Grids com `grid-cols-N` sem breakpoint → zero ocorrências em features

## Qualidade

- [x] QLT01 `npx nx build web` sem erros após todas as mudanças
- [ ] QLT02 `npx nx lint web` sem erros novos introduzidos
