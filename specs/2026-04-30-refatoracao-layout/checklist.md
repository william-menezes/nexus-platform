# Checklist: Refatoração de Layout — Breadcrumb no Header e Padronização de Telas

Criada em: 2026-04-30
Referência: `spec.md`

## Produto

- [ ] CA01 Critérios de aceite AC01–AC10 revisados e objetivos claros
- [ ] CA02 Não-objetivos explícitos: sem mudança de lógica de negócio, sem novos componentes, sem animações

## Layout e UX

- [ ] LAY01 Breadcrumb renderizado no header (não em nenhuma feature page)
- [ ] LAY02 Em mobile (375px), itens intermediários truncam com "…" e o último item aparece completo
- [ ] LAY03 Telas de formulário: botão Voltar à esquerda do título
- [ ] LAY04 Telas de detalhe: botão Voltar à esquerda do título
- [ ] LAY05 Telas de listagem: botão de ação primária à direita do título
- [ ] LAY06 Cards de formulário: `w-full`, sem `max-w-*`
- [ ] LAY07 Botões Salvar/Cancelar no rodapé do card, alinhados à direita

## Funcionalidade

- [ ] FUN01 Botão Excluir presente em todas as tabelas de listagem
- [ ] FUN02 Botão Excluir abre `p-confirmDialog` antes de executar a exclusão
- [ ] FUN03 Submit dos formulários funciona corretamente após mover botões para fora do `<form>` (atributo `form=`)

## Segurança / Tenancy

- [ ] SEC01 Nenhuma mudança em guards, permissões ou RLS
- [ ] SEC02 A exclusão nas listagens usa o mesmo endpoint/service já testado

## Qualidade

- [ ] QLT01 `npx nx build web` sem erros
- [ ] QLT02 `npx nx lint web` sem erros bloqueantes
- [ ] QLT03 Nenhum `<p-breadcrumb>` restante em arquivos de feature (`grep` retorna zero)
