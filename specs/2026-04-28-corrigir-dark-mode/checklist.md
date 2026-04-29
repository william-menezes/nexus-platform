# Checklist: Correção de Dark Mode, Contraste de Botão e Headers de Página

Criada em: 2026-04-28
Referência: `spec.md`

## Produto

- [ ] CA01 Critérios de aceite AC01–AC08 revisados e verificáveis
- [ ] CA02 Não-objetivos explícitos (sem mudanças em auth/landing/admin, sem redesign)

## Dark Mode

- [ ] DRK01 Em dark mode: `p-card` exibe fundo Slate-800 (`#1E293B`), não preto
- [ ] DRK02 Em dark mode: `p-table` header exibe Slate-900 e body exibe Slate-800
- [ ] DRK03 Em dark mode: inputs (`p-inputtext`, `p-select`, `p-textarea`) exibem fundo Slate-800
- [ ] DRK04 Em dark mode: `p-breadcrumb` mantém fundo transparente (sem caixa preta)
- [ ] DRK05 Light mode intacto após as mudanças (sem regressão)

## Contraste

- [ ] CNT01 Botão primário: label `color: #FFFFFF` em light e dark mode
- [ ] CNT02 Contraste ≥ 4.5:1 (WCAG AA) confirmado via DevTools
- [ ] CNT03 Botões `outlined` e `text` não foram afetados (cores corretas)

## Headers de Página

- [ ] HDR01 Zero ocorrências de `text-2xl font-bold` inline nos HTMLs de features (`grep` → 0)
- [ ] HDR02 Todos os componentes de lista têm `nx-page-title` + `nx-page-subtitle`
- [ ] HDR03 Todos os componentes de form têm `nx-page-title` + `nx-page-subtitle`
- [ ] HDR04 Todos os componentes de detalhe têm `nx-page-title` + `nx-page-subtitle`
- [ ] HDR05 `.nx-page-header` usado como wrapper flex nas telas com botão de ação

## Qualidade

- [ ] QLT01 `npx nx build web` sem erros
- [ ] QLT02 Nenhuma regressão visual em light mode (verificação manual em 3 telas)
- [ ] QLT03 Sem `!important` adicionado no CSS (respeitar hierarquia de tokens)
