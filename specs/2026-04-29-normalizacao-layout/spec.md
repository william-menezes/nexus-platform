# Normalização de Layout das Telas

Status: Draft  
Owner: [@william.damascena]  
Criada em: 2026-04-29  
Links: —

## Contexto

As telas do SimplificaOS apresentam inconsistências visuais: breadcrumbs com fundo diferente da página, headers sem padrão definido (alguns sem botão voltar, outros com posição diferente), conteúdo ora em cards ora em divs soltas, e inputs de data sem padrão único. Isso prejudica a coesão visual e a manutenibilidade do projeto.

Problemas identificados na análise de código:
1. `<p-breadcrumb>` tem fundo padrão do PrimeNG (surface branco), diferente da cor de fundo da página (`var(--bg-light)`)
2. Algumas telas têm botão "Voltar" dentro do `.nx-page-header`, outras têm `<a>` soltos sem classe, outras não têm nenhum
3. Telas de lista e detalhe não envolvem o conteúdo em `<p-card>`, enquanto telas de formulário sim — não há padrão único
4. `entry-form.component.html` usa `<input type="date">` nativo em vez de `<p-datepicker>` (inconsistência com as outras ~5 telas que já usam datepicker)

## Objetivos

- [ ] `<p-breadcrumb>` com fundo transparente (herda a cor da página) em todas as telas
- [ ] **Telas de lista**: header com título, subtítulo e botão de ação principal ("Novo X") — sem botão Voltar
- [ ] **Telas de form/detalhe**: header com título, subtítulo e botão "Voltar" apontando para a tela pai
- [ ] Todo conteúdo após o header (busca, filtros, tabela, campos de form) está envolvido em `<p-card styleClass="w-full">` — sem elementos soltos abaixo do header
- [ ] Todos os inputs de data usam `<p-datepicker dateFormat="dd/mm/yy" [showIcon]="true">` com ícone de calendário no canto direito
- [ ] Layout responsivo: header empilha verticalmente em mobile, cards e grids se adaptam

## Não-objetivos

- [ ] Redesign visual — apenas padronização de estrutura e componentes
- [ ] Mudanças em lógica de negócio, rotas ou serviços
- [ ] Criação de novas telas
- [ ] Alteração de tema (cores, tipografia, dark mode)
- [ ] Mudanças no backend/API

## Usuários e cenários

### Cenário 1 — Breadcrumb integrado ao fundo

**Dado** que o usuário está em qualquer tela da aplicação  
**Quando** visualiza o breadcrumb no topo  
**Então** o breadcrumb tem o mesmo fundo da página (transparente), sem "caixa flutuante" visível

### Cenário 2 — Header padronizado com navegação

**Dado** que o usuário está em uma tela de formulário ou detalhe (ex: `/app/clientes/novo`)  
**Quando** visualiza o topo da tela  
**Então** vê um bloco com título à esquerda, subtítulo abaixo e botão "Voltar" à direita

### Cenário 3 — Conteúdo em card

**Dado** que o usuário está em qualquer tela (lista, formulário, detalhe)  
**Quando** visualiza o conteúdo abaixo do header  
**Então** todo o conteúdo está dentro de um `p-card` que preenche toda a largura disponível

### Cenário 4 — Inputs de data padronizados

**Dado** que o usuário está preenchendo qualquer formulário com campo de data  
**Quando** clica no campo de data  
**Então** abre o seletor de calendário PrimeNG com formato `dd/mm/aaaa` e ícone de calendário visível à direita

### Cenário 5 — Responsividade

**Dado** que o usuário acessa a aplicação em um dispositivo mobile (< 640px)  
**Quando** visualiza qualquer tela  
**Então** o header empilha título/subtítulo e botão verticalmente; grids de formulário passam para coluna única

## Regras de negócio

- Não há regras de negócio específicas. Esta é uma normalização puramente visual/estrutural.

## Critérios de aceite

- AC01 — Em todas as telas, o `<p-breadcrumb>` tem `styleClass="nx-breadcrumb"` e a classe `.nx-breadcrumb` define `background: transparent` (ou `background: var(--bg-light)` herdando a página)
- AC02 — Todas as telas de formulário e detalhe têm `.nx-page-header` com: `h1.nx-page-title`, `p.nx-page-subtitle` e um `p-button` com `routerLink` para a tela anterior
- AC03 — Telas de lista também têm `.nx-page-header` com título, subtítulo e (quando aplicável) botão de ação principal à direita
- AC04 — O conteúdo principal de cada tela está envolvido em `<p-card styleClass="w-full">` (ou a tag já existente mantida)
- AC05 — Nenhum `<input type="date">` nativo existe nos templates; todos substituídos por `<p-datepicker dateFormat="dd/mm/yy" [showIcon]="true">`
- AC06 — Em mobile (Tailwind `sm:`), grids de formulários se reduzem a 1 coluna e o header empilha verticalmente

## Impacto técnico

- Projetos Nx afetados: `web`
- API: nenhuma mudança
- Banco: nenhuma mudança
- Permissões (RBAC): nenhuma mudança
- CSS global afetado: `apps/web/src/styles.css` — classe `.nx-breadcrumb`
- Templates afetados: ~40+ arquivos `.component.html` em `apps/web/src/app/features/`
- Componentes TS afetados: apenas se precisar importar `DatePickerModule` onde falta

## Plano de testes

- Manual: navegar em cada tela listada nas tasks e verificar visualmente header + card + breadcrumb
- Manual: abrir formulário com data, confirmar datepicker com ícone e formato pt-BR
- Manual: redimensionar janela para < 640px; confirmar empilhamento do header e colunas
- Code review: `grep '<input type="date"'` nos templates deve retornar zero resultados

## Rollout

- Feature flag: não
- Backwards compatibility: total — mudanças são puramente visuais/estruturais
- Migrações: nenhuma
