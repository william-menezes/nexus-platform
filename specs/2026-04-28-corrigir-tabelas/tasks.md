# Tarefas - Corrigir Layout das Tabelas

Referencia: `spec.md` e `plan.md`

- [ ] TSK001 Confirmar o inventario das tabelas alvo e definir quais listagens entram nesta primeira padronizacao
- [ ] TSK002 Definir o padrao de referencia para tabelas com `p-table`: header ordenavel, hover, empty state, footer, paginacao e resumo "X de Y"
- [ ] TSK003 Ajustar os tokens e estilos globais de DataTable em `apps/web/src/styles.css`, com foco em hover, header, body, empty state e paginator no tema claro e escuro
- [ ] TSK004 Padronizar uma tabela referencia que ja usa `p-table`, incluindo `rowHover`, ordenacao nas colunas elegiveis, template de vazio e footer completo
- [ ] TSK005 Migrar ao menos uma tabela HTML customizada relevante para `p-table`, preservando colunas, acoes, responsividade e comportamento atual
- [ ] TSK006 Replicar o padrao nas demais listagens alvo que hoje usam `p-table`, evitando hardcodes locais e alinhando o tema dark
- [ ] TSK007 Implementar ou extrair a logica compartilhada necessaria para calcular e exibir corretamente o resumo "X de Y"
- [ ] TSK008 Revisar colunas ordenaveis em cada tabela, habilitando sort apenas onde houver semantica adequada
- [ ] TSK009 Validar os estados vazios para garantir mensagem contextual e consistencia visual entre as tabelas
- [ ] TSK010 Executar validacao manual em tabelas com dados e sem dados, nos temas claro e escuro, incluindo troca de pagina e page size
- [ ] TSK011 Rodar `npx nx build web`
- [ ] TSK012 Conferir os criterios de aceite, atualizar artefatos da spec se necessario e marcar a entrega como concluida
