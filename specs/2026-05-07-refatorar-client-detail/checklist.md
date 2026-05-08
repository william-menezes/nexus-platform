# Checklist — Refatoração do Client Detail

Criada em: 2026-05-07
Referência: `spec.md`

## Visual / AC

- [x] AC01 Hero-card: avatar, nome, pills PF/PJ + Ativo, contatos em linha
- [x] AC02 "+ Nova OS" navega para /app/os/nova?clientId=...
- [x] AC03 "Editar" navega para /app/clientes/:id/editar
- [x] AC04 Linha de KPIs visível com valores corretos
- [x] AC05 Aba Histórico: timeline em ordem cronológica decrescente
- [x] AC06 Aba Ordens de Serviço: lista com código, status, data
- [x] AC07 Aba Orçamentos: lista com código, status, data
- [x] AC08 Sidebar Detalhes: cidade, endereço, observações
- [x] AC09 Sidebar Ações rápidas: navegação correta para cada link
- [x] AC10 Excluir cliente: confirm dialog + soft delete
- [ ] AC11 Mobile 375px: sidebar abaixo, sem overflow horizontal — validar manualmente
- [x] AC12 Zero `style=""` inline

## Qualidade

- [x] QLT01 `npx nx build web` sem erros TypeScript
- [x] QLT02 Sem warnings de template (NG8113)
- [x] QLT03 Todos os valores usam tokens CSS (`var(--primary)` etc.), sem hex hardcoded
