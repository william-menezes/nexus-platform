# Corrigir Layout das Tabelas

Status: Draft
Owner: William
Criada em: 2026-04-28
Links: [solicitacao de padronizacao visual das tabelas]

## Contexto

As tabelas do frontend estao com comportamento e apresentacao inconsistentes entre telas. No modo escuro, a cor de hover atual reduz o contraste e dificulta a leitura das informacoes. Alem disso, faltam recursos basicos de usabilidade e padronizacao que o usuario espera em listas tabulares, como ordenacao pelo cabecalho, estado vazio informativo e um rodape com paginacao e resumo da quantidade de registros.

A ausencia desse padrao piora a escaneabilidade das listas, aumenta a carga cognitiva do usuario e faz com que cada tela tenha uma experiencia diferente, mesmo quando exibe dados com a mesma estrutura.

## Objetivos

- [ ] Padronizar o layout visual das tabelas do sistema no tema claro e no tema escuro
- [ ] Ajustar as cores de hover no modo escuro para preservar contraste e legibilidade
- [ ] Adicionar ordenacao pelo header das colunas aplicaveis
- [ ] Incluir template de estado vazio nas tabelas sem registros
- [ ] Adicionar no footer controles de paginacao e selecao da quantidade de itens por pagina
- [ ] Exibir no footer um resumo de exibicao de dados no formato "X de Y"

## Nao-objetivos

- [ ] Redesenhar a arquitetura geral das paginas ou dos cards que envolvem as tabelas
- [ ] Alterar regras de negocio, consultas de API ou contratos de backend
- [ ] Implementar filtros avancados, busca global nova ou exportacao de dados
- [ ] Substituir PrimeNG por outra solucao de tabela
- [ ] Padronizar componentes que nao usam tabela

## Usuarios e cenarios

### Cenario 1 - Usuario navega em tabela no modo escuro

**Dado** que o usuario esta utilizando o sistema com tema escuro
**Quando** passa o mouse sobre as linhas de uma tabela
**Entao** o hover deve destacar a linha sem comprometer a leitura do texto, badges e acoes

### Cenario 2 - Usuario deseja ordenar uma listagem

**Dado** que a tabela possui colunas ordenaveis
**Quando** o usuario clica no header de uma coluna suportada
**Entao** os registros devem ser reordenados visualmente e o cabecalho deve indicar o estado da ordenacao

### Cenario 3 - Usuario acessa uma tabela sem dados

**Dado** que nao existem registros para a listagem atual
**Quando** a tabela e renderizada
**Entao** deve ser exibido um estado vazio claro, consistente e alinhado ao contexto da tela

### Cenario 4 - Usuario navega entre paginas de uma listagem

**Dado** que a tabela possui mais registros do que o limite exibido por pagina
**Quando** o usuario utiliza os controles do footer
**Entao** ele deve conseguir trocar de pagina, alterar a quantidade de itens exibidos e entender quantos registros estao visiveis em relacao ao total

## Regras de negocio

- A mudanca e exclusivamente de frontend e nao altera regras de dominio
- O padrao de tabela deve respeitar o design system definido em `apps/web/src/styles.css`
- No tema escuro, cores de hover e elementos do footer devem usar tokens do tema e nao valores hardcoded
- A ordenacao deve ser aplicada apenas em colunas cujo dado tenha semantica adequada para ordenacao
- O estado vazio deve ser contextual, mas seguir um padrao visual compartilhado
- O resumo do footer deve considerar o total de registros disponiveis e a quantidade atualmente exibida na pagina
- O texto de resumo deve seguir o formato "X de Y", por exemplo "10 de 100"

## Criterios de aceite

- AC01: Todas as tabelas alvo da feature passam a usar um padrao visual consistente para header, body, hover, empty state e footer
- AC02: No tema escuro, o hover das linhas preserva legibilidade minima adequada para texto e acoes sem perda perceptivel de contraste
- AC03: Tabelas com colunas elegiveis exibem ordenacao acionavel no header com indicacao visual do estado atual
- AC04: Tabelas sem registros exibem um template de estado vazio em vez de area vazia ou mensagem solta fora do componente
- AC05: O footer das tabelas inclui controles de paginacao e selecao da quantidade de itens por pagina
- AC06: O footer exibe um resumo no formato "X de Y" refletindo corretamente itens exibidos e total de registros
- AC07: A implementacao utiliza PrimeNG e os tokens globais do projeto, sem hardcode de cores para os estados de tema
- AC08: `npx nx build web` conclui sem erros apos a implementacao

## Impacto tecnico (rascunho)

- Projetos Nx afetados: `web`
- API: nenhum novo endpoint; apenas consumo e apresentacao dos dados existentes
- Banco: nenhum impacto
- Permissoes (RBAC): nenhum impacto
- Observabilidade: nao aplicavel

## Plano de testes

- Unit: cobrir logica utilitaria de resumo de exibicao e configuracoes compartilhadas de tabela, se houver extracao para helper/componente
- Integracao: validar componentes de lista representativos com ordenacao, empty state e paginacao renderizados corretamente
- E2E/manual: verificar pelo menos uma tabela com dados e uma vazia em tema claro e escuro; validar ordenacao visual, troca de pagina, alteracao de page size e resumo "X de Y"

## Rollout

- Feature flag? nao
- Backwards compatibility: manter colunas, acoes e contratos de dados existentes; alterar apenas o comportamento visual e interacoes da tabela
- Migracoes: nenhuma
