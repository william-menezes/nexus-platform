# Refatoração de Tema — Identidade Visual SimplificaOS

Status: In Progress
Owner: William
Criada em: 2026-04-11
Atualizada em: 2026-04-27
Links: [layout de referência anexado na conversa]

## Contexto

O `tailwind.config.js` atual define a cor `primary` como laranja/castanho (`#a63b00`), em conflito direto com o design system definido em `styles.css` (azul `#2563EB`) e com o preset do PrimeNG (também azul `#3b82f6`). Isso causa botões, links e badges laranjas em vários pontos da aplicação, quebrando a identidade visual.

Adicionalmente, a fonte configurada no Tailwind (`Manrope`) diverge da usada no body CSS (`Inter`). O objetivo é unificar o sistema de cores e tipografia em uma única fonte de verdade, com foco em Tailwind utilities e mínimo de CSS customizado.

## Objetivos

- [x] Corrigir `tailwind.config.js` para usar azul como cor primária (alinhado com `styles.css`)
- [x] Eliminar todos os botões/links com cor laranja indevida
- [x] Unificar tipografia (`Inter` como fonte principal)
- [x] Garantir que o modo escuro funcione corretamente via `html.dark`
- [x] Alinhar identidade visual com o layout de referência (dashboard admin clean com blue primary)

## Não-objetivos

- Redesign completo de telas (não é uma reescrita de layout)
- Implementação de modo escuro em componentes que ainda não têm suporte
- Alteração de componentes de backend ou shared libs

## Usuários e cenários

### Cenário 1 — Usuário vê botão primário com cor correta

**Dado** que o usuário acessa qualquer tela autenticada do SimplificaOS  
**Quando** visualiza um botão de ação principal (ex: "Nova OS", "Salvar")  
**Então** o botão deve ser azul (`#2563EB`), não laranja

### Cenário 2 — Usuário acessa dashboard admin

**Dado** que o SUPER_ADMIN acessa `/admin/dashboard`  
**Quando** visualiza o card de "tenants em trial"  
**Então** o número deve estar em azul ou cor neutra, não em `amber-500` laranja

### Cenário 3 — Identidade visual consistente na landing

**Dado** que um visitante acessa a landing page  
**Quando** visualiza badges de status e ícones de feature  
**Então** os elementos seguem a paleta azul + status semânticos (verde/âmbar/vermelho apenas para status, não para ação primária)

## Regras de negócio

- Não há regras de negócio de domínio envolvidas — mudança puramente visual/CSS
- Cores de status semânticos (`amber` para "aguardando", `green` para "concluído", `red` para "cancelado") são **permitidas** e não devem ser alteradas
- Somente o uso de `amber`/`orange` como cor de **ação primária** ou **destaque de dado neutro** deve ser corrigido

## Critérios de aceite

- AC01: `tailwind.config.js` define `primary` como escala de azul alinhada com `styles.css` (DEFAULT: `#2563EB`)
- AC02: Nenhum botão `p-button` sem severity exibido em cor laranja/castanho
- AC03: A fonte `Inter` é carregada e aplicada globalmente (sem `Manrope` como fonte padrão)
- AC04: O card de métricas no admin-dashboard usa cor azul ou texto primário para o valor de trial
- AC05: Inspeção visual em `/app/dashboard`, `/app/os`, `/app/clientes`, `/admin/dashboard` sem elementos laranjas indevidos
- AC06: Modo escuro (toggle via `html.dark`) funciona corretamente nas telas principais

## Impacto técnico (rascunho)

- Projetos Nx afetados: `web` apenas
- API: nenhum impacto
- Banco: nenhum impacto
- Permissões (RBAC): nenhum impacto
- Observabilidade: nenhum impacto

## Plano de testes

- Unit: não aplicável (sem lógica de negócio)
- Integração: não aplicável
- E2E/manual: inspeção visual nas 5 rotas principais (landing, login, dashboard, os-list, admin-dashboard) em modo claro e escuro

## Rollout

- Feature flag? não — mudança puramente visual, sem risco de dados
- Backwards compatibility: manter aliases `--nx-*` em `styles.css` para componentes legados
- Migrações: nenhuma
