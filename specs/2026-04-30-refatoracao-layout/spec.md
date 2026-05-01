# Refatoração de Layout — Breadcrumb no Header e Padronização de Telas

Status: Draft
Owner: [@william]
Criada em: 2026-04-30
Links: —

## Contexto

O layout atual tem dois problemas principais de consistência:

1. **Breadcrumb descentralizado** — cada componente de feature renderiza seu próprio `p-breadcrumb` localmente, gerando duplicação e inconsistência visual. O breadcrumb deve viver no `HeaderComponent`, que já é o ponto central de navegação do shell.

2. **Padrão de tela inconsistente** — as telas de listagem, formulário e detalhe têm estruturas ligeiramente diferentes entre si (botão voltar à direita vs. nenhum, largura do card variável, ações do form em posições diferentes). A padronização facilita a leitura do código e melhora a experiência do usuário.

## Objetivos

- [ ] Mover o `p-breadcrumb` para o `HeaderComponent`, alimentado por um `BreadcrumbService` baseado em signals
- [ ] Aplicar truncamento com ellipsis nos itens intermediários do breadcrumb em mobile, preservando o último item completo
- [ ] Padronizar telas de **listagem**: título+subtítulo à esquerda, botão de ação à direita
- [ ] Padronizar telas de **formulário**: botão voltar à esquerda do bloco título+subtítulo; card full-width; footer do card com salvar/cancelar à direita
- [ ] Padronizar telas de **detalhe/exibição**: botão voltar à esquerda do bloco título+subtítulo; card full-width
- [ ] Adicionar botão **Excluir** na coluna de ações de todas as tabelas de listagem

## Não-objetivos

- Mudar a lógica de negócio ou chamadas de API de qualquer tela
- Alterar o comportamento do breadcrumb em telas desktop (sem truncamento)
- Criar novos componentes de tela; apenas ajustar os existentes
- Adicionar animações ou transições ao breadcrumb

## Usuários e cenários

### Cenário 1 — Breadcrumb centralizado no header

**Dado** que o usuário está em qualquer tela do sistema
**Quando** a página é renderizada
**Então** o breadcrumb aparece no header, logo após o botão de colapso da sidebar, e não aparece mais dentro do conteúdo da página

### Cenário 2 — Ellipsis mobile no breadcrumb

**Dado** que o usuário está em mobile (viewport < 640px)
**Quando** o breadcrumb tem 3 ou mais itens (ex: Home > Ordens de Serviço > Nova OS)
**Então** os itens intermediários são truncados com "…" (ex: "Ordens de …") e o último item ("Nova OS") é exibido completo

### Cenário 3 — Layout de tela de formulário padronizado

**Dado** que o usuário acessa uma tela de formulário (novo ou editar)
**Quando** a tela é renderizada
**Então** o botão "Voltar" aparece à esquerda do título/subtítulo (ícone de seta, sem label em mobile); o card ocupa toda a largura disponível; os botões "Salvar" e "Cancelar" ficam no rodapé do card, alinhados à direita

### Cenário 4 — Botão excluir nas listagens

**Dado** que o usuário está em uma tela de listagem
**Quando** visualiza a coluna "Ações"
**Então** há um botão de excluir (ícone lixeira, severity danger) além dos botões de ver e editar já existentes

## Regras de negócio

- O `BreadcrumbService` deve expor um `Signal<MenuItem[]>` para os itens e um `Signal<MenuItem>` para o home item
- Cada componente de feature usa `inject(BreadcrumbService).set(items)` no `constructor` ou em `ngOnInit` (não em computed)
- Ao navegar para outra rota, os itens são redefinidos pelo novo componente (sem limpeza explícita necessária)
- O botão "Excluir" nas listagens dispara o mesmo fluxo de confirmação (`p-confirmDialog`) que já existe nas telas de detalhe
- O truncamento com ellipsis aplica-se apenas em viewports `< 640px` (classe `sm:` do Tailwind = breakpoint de 640px)
- O último item do breadcrumb nunca trunca; os intermediários truncam com `max-width` fixo

## Critérios de aceite

- AC01 O `p-breadcrumb` é renderizado dentro do `header.component.html`, não em nenhum componente de feature
- AC02 Nenhum componente de feature tem `<p-breadcrumb>` em seu template HTML
- AC03 Em mobile (< 640px), itens intermediários do breadcrumb truncam com "…"; o último item é completamente visível
- AC04 Em todas as telas de formulário, o botão Voltar está à esquerda do bloco título+subtítulo
- AC05 Em todas as telas de detalhe, o botão Voltar está à esquerda do bloco título+subtítulo
- AC06 Em todas as telas de listagem, o botão de ação primária está à direita do título+subtítulo
- AC07 O card nas telas de formulário ocupa 100% da largura disponível (sem `max-w-*`)
- AC08 Os botões "Salvar" e "Cancelar" nas telas de formulário ficam no rodapé do card, alinhados à direita
- AC09 Todas as tabelas de listagem têm o botão Excluir (ícone `pi pi-trash`, severity `danger`) na coluna "Ações"
- AC10 O botão Excluir nas listagens abre `p-confirmDialog` antes de executar a exclusão

## Impacto técnico (rascunho)

- Projetos Nx afetados: `web`
- API: nenhum
- Banco: nenhum
- Permissões (RBAC): nenhuma mudança (exclusão nas listagens usa o mesmo guard já existente)
- Observabilidade: nenhuma
- Arquivos-chave afetados:
  - `apps/web/src/app/layout/components/header/header.component.ts` — importar `BreadcrumbModule`, injetar `BreadcrumbService`
  - `apps/web/src/app/layout/components/header/header.component.html` — adicionar `<p-breadcrumb>`
  - `apps/web/src/app/layout/core/breadcrumb/breadcrumb.service.ts` — novo serviço (signal-based)
  - `apps/web/src/styles.css` — CSS para ellipsis mobile no breadcrumb
  - Todos os `*.component.html` de feature que contém `<p-breadcrumb>` (remover)
  - Todos os `*.component.ts` de feature que injetam `BreadcrumbService` local (atualizar para novo serviço)
  - Todos os `*-list.component.html` (adicionar botão excluir)
  - Todos os `*-list.component.ts` (adicionar método de exclusão)
  - Todos os `*-form.component.html` (mover botão voltar para esquerda, remover max-w do card, mover ações para footer do card)
  - Todos os `*-detail.component.html` (mover botão voltar para esquerda)

## Plano de testes

- Unit: `BreadcrumbService` — verificar que `set()` atualiza o signal corretamente
- Integração: nenhum (mudanças puramente de template/CSS)
- E2E/manual: navegar entre telas verificando breadcrumb, layout e botão excluir

## Rollout

- Feature flag? não
- Backwards compatibility: compatível — apenas reorganização de UI, sem mudança de API
- Migrações: nenhuma
