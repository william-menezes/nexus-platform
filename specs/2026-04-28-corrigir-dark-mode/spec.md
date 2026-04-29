# Correção de Dark Mode, Contraste de Botão e Headers de Página

Status: Draft
Owner: William
Criada em: 2026-04-28
Links: —

## Contexto

Após a padronização de templates e breadcrumbs (spec `corrigir-tailwind`), o dark mode da aplicação apresenta três problemas visuais:

1. **Fundo preto em vez de azul escuro:** `p-card`, `p-table`, `p-breadcrumb` e inputs exibem o fundo quase preto (`#0a0a0a`–`#1a1a1a`) do preset Aura padrão em vez do azul-acinzentado da nossa paleta Slate (`#1E293B` para cards, `#0F172A` para página).
   - Causa raiz: o `styles.css` sobrescreve `--p-surface-card` e `--p-surface-ground` apenas em `:root` (light mode). No dark mode, o PrimeNG Aura redefine esses mesmos tokens para os valores padrão escuros do preset, sobrepondo os nossos.

2. **Contraste ruim no botão primário:** o texto do botão `p-button` primário fica preto ou muito escuro em cima do azul `#2563EB`, dificultando a leitura.
   - Causa raiz: o CSS customizado (`styles.css`) define `background` e `border-color` do botão, mas não define `color`. O PrimeNG Aura usa `--p-button-primary-color` / `--p-primary-contrast-color` para o texto — valor que no preset Aura 21 pode resultar em escuro se não for explicitamente sobrescrito.

3. **Inconsistência nos headers de página:** componentes usam `class="text-2xl font-bold"` inline (pesos e tamanhos ligeiramente diferentes conforme o Tailwind version), e muitos não possuem um subtítulo descrevendo o contexto da tela. As classes `.nx-page-title` e `.nx-page-subtitle` já existem no `styles.css` mas não são usadas consistentemente.

## Objetivos

- [ ] Fazer `p-card`, `p-table` (header e body), `p-breadcrumb`, `p-inputtext`, `p-select`, `p-datepicker` e `p-textarea` exibirem o fundo correto da paleta Slate no dark mode
- [ ] Garantir texto branco (`#F1F5F9`) em todos os botões primários
- [ ] Padronizar o header de todas as páginas `/app/**` com `.nx-page-title` + `.nx-page-subtitle` consistentes

## Não-objetivos

- Redesenhar ou alterar a identidade visual do produto
- Alterar o dark mode das páginas públicas (`/`, `/login`, `/cadastro`)
- Criar novo sistema de design ou trocar o preset PrimeNG
- Alterar lógica de negócio, rotas ou qualquer backend
- Alterar telas do painel `/admin`

## Usuários e cenários

### Cenário 1 — Operador no modo escuro

**Dado** que o operador ativa o dark mode (classe `html.dark`)
**Quando** acessa qualquer tela do app (ex.: `/app/clientes`)
**Então** todos os cards, tabelas e inputs exibem fundo `#1E293B` (Slate-800), não preto

### Cenário 2 — Clicar em botão de ação

**Dado** qualquer tela com botão primário
**Quando** o botão está visível (light ou dark mode)
**Então** o label do botão é branco (`#FFFFFF`) com contraste WCAG AA mínimo

### Cenário 3 — Leitura rápida da tela

**Dado** que o operador acessa qualquer página do app
**Quando** a tela carrega
**Então** existe um título `h1` com peso 800 + um parágrafo subtítulo em `text-secondary` descrevendo o contexto

## Regras de negócio

N/A — mudanças puramente visuais/CSS.

## Critérios de aceite

- AC01 Em dark mode: fundo do `.p-card .p-card-body` === `#1E293B` (Slate-800)
- AC02 Em dark mode: fundo das linhas do `p-table` === `#1E293B` e header da tabela === `#0F172A` (Slate-900)
- AC03 Em dark mode: fundo dos `p-inputtext`, `p-select`, `p-textarea` === `#1E293B`
- AC04 Em dark mode: fundo do `p-breadcrumb` é transparente (sem fundo preto)
- AC05 Em light e dark mode: `color` do label do `.p-button` primário é `#FFFFFF`
- AC06 Contraste do botão primário ≥ 4.5:1 (WCAG AA) medido com DevTools
- AC07 Todos os componentes de lista, form e detalhe em `/app/**` têm `<h1 class="nx-page-title">` + `<p class="nx-page-subtitle">`
- AC08 `npx nx build web` sem erros após todas as mudanças

## Impacto técnico (rascunho)

- Projetos Nx afetados: `web` apenas
- API: nenhum impacto
- Banco: nenhum impacto
- RBAC: nenhum impacto
- Arquivos afetados:
  - `apps/web/src/styles.css` — adicionar overrides de tokens PrimeNG no bloco `html.dark`; corrigir cor do botão
  - `apps/web/src/app/features/**/*.component.html` — padronizar headers com `.nx-page-title` + `.nx-page-subtitle`
  - `apps/web/src/app/app.config.ts` — possivelmente ajustar o `NexusPreset` para definir `contrastColor` explicitamente

## Plano de testes

- Unit: N/A (CSS)
- Integração: N/A
- E2E/manual:
  - Ativar dark mode → inspecionar fundo dos componentes com DevTools (computed styles)
  - Verificar contraste do botão com Chrome DevTools > Accessibility > Contrast ratio
  - Navegar por 5 telas representativas: lista, form, detalhe, dashboard, settings

## Rollout

- Feature flag? não
- Backwards compatibility: sim — apenas adiciona CSS que sobrescreve corretamente o preset; não quebra light mode
- Migrações: nenhuma
