# Plano - Corrigir Layout das Tabelas

Referencia: `spec.md`

## Abordagem

- Inventariar todas as tabelas relevantes em `apps/web/src/app/features/**` e classifica-las em dois grupos:
  - tabelas ja baseadas em `p-table` que precisam apenas de padronizacao visual e comportamental
  - tabelas HTML customizadas que devem ser migradas para `p-table` para aderir ao padrao do projeto
- Definir um padrao unico para listagens com:
  - header com colunas ordenaveis quando fizer sentido
  - hover consistente em tema claro e escuro
  - template de empty state dentro da propria tabela
  - footer com paginacao, seletor de quantidade por pagina e resumo "X de Y"
- Concentrar a maior parte da padronizacao em estilos globais e configuracao consistente do PrimeNG, reduzindo duplicacao por componente.
- Aplicar o padrao primeiro em uma ou duas tabelas referencia e depois replicar para as demais listagens alvo.

## Arquitetura e decisoes

- O componente base de tabela continuara sendo o `p-table` do PrimeNG, em linha com a constituicao do projeto.
- Tabelas HTML customizadas, como a de clientes, devem ser avaliadas para migracao a `p-table` se isso reduzir divergencia estrutural e facilitar ordenacao, empty state e paginacao.
- A padronizacao visual deve partir de `apps/web/src/styles.css`, ajustando tokens e seletores globais do DataTable em vez de hardcodes locais.
- O hover do modo escuro deve usar tokens derivados de `--hover-bg`, `--active-bg` e overrides do PrimeNG, garantindo contraste suficiente para texto, links, badges e botoes.
- A ordenacao sera habilitada apenas em colunas com semantica apropriada, usando `pSortableColumn` e `p-sortIcon`.
- O resumo "X de Y" deve refletir corretamente:
  - `X`: quantidade de itens atualmente exibidos na pagina
  - `Y`: total de itens da fonte atual da tabela
- Se a repeticao de footer, resumo e configuracao de paginacao ficar alta, sera considerada uma abstracao leve:
  - helper utilitario para calcular resumo
  - configuracao compartilhada por componente
  - componente wrapper apenas se a duplicacao justificar
- A implementacao nao deve alterar contratos de dados nem exigir mudancas de API.

## Mudancas por camada

- Web (Angular/PrimeNG/Tailwind):
  - ajustar estilos globais de `.p-datatable`, header, body, hover, paginator e empty state em `apps/web/src/styles.css`
  - padronizar listagens existentes em `p-table`
  - migrar tabelas customizadas relevantes para `p-table` quando necessario
  - habilitar ordenacao em colunas suportadas
  - adicionar `rowHover`, `paginator`, `rowsPerPageOptions`, empty state e resumo visual no footer
  - revisar classes Tailwind locais que conflitem com o design system ou com o tema dark
- API (NestJS/TypeORM):
  - nenhum impacto esperado
- Banco (Postgres/Supabase/RLS):
  - nenhum impacto esperado
- Shared (`libs/shared-types`, etc.):
  - nenhum impacto inicial previsto
  - opcionalmente, pode surgir um helper simples de exibicao no frontend se a regra de resumo precisar ser reutilizada

## Riscos e mitigacao

- Risco: tabelas diferentes usam estruturas de dados e colunas heterogeneas
  - Mitigacao: aplicar um contrato de comportamento comum, sem forcar uniformidade de colunas ou conteudo
- Risco: migrar tabela HTML customizada para `p-table` pode introduzir regressao visual
  - Mitigacao: fazer migracao em etapas, comparando com a tela original e validando responsividade
- Risco: hover no modo escuro continuar com contraste insuficiente em alguns componentes internos
  - Mitigacao: validar manualmente com `p-tag`, links, botoes textuais e linhas selecionaveis em tabelas reais
- Risco: ordenacao visual em colunas inadequadas gerar expectativa errada
  - Mitigacao: habilitar ordenacao apenas em campos simples e claramente ordenaveis, como codigo, nome, data, status textual e valores
- Risco: cada componente calcular pagina atual e resumo de forma diferente
  - Mitigacao: definir uma regra unica para `first`, `rows`, total e quantidade exibida antes de replicar a implementacao

## Estrategia de validacao

- AC01:
  - revisar tabelas alvo e confirmar presenca do mesmo padrao estrutural de header, body, hover, empty state e footer
- AC02:
  - validar tema escuro em pelo menos duas tabelas com conteudo real e acoes por linha
- AC03:
  - verificar colunas ordenaveis com `pSortableColumn` e `p-sortIcon` funcionando visualmente
- AC04:
  - validar renderizacao de empty state em tabela sem dados, sem mensagens soltas fora do `p-table`
- AC05:
  - confirmar presenca de paginador e seletor de quantidade por pagina nas listagens alvo
- AC06:
  - validar texto de resumo "X de Y" em cenarios de primeira pagina, pagina intermediaria e ultima pagina
- AC07:
  - revisar implementacao para garantir uso de tokens e estilos globais, evitando cores hardcoded para claro/escuro
- AC08:
  - executar `npx nx build web`

## Sequencia sugerida de implementacao

- Etapa 1: mapear tabelas alvo e definir o padrao de referencia
- Etapa 2: ajustar estilos globais do DataTable e tokens relacionados ao dark mode
- Etapa 3: padronizar uma tabela referencia que ja usa `p-table`
- Etapa 4: migrar uma tabela customizada relevante para `p-table`
- Etapa 5: replicar paginacao, empty state, ordenacao e resumo nas demais listagens alvo
- Etapa 6: validar build e testes manuais em tema claro/escuro e desktop/mobile
