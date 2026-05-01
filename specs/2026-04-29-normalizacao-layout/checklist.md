# Checklist: Normalização de Layout das Telas

Criada em: 2026-04-29  
Referência: `spec.md`

## Produto

- [ ] CA01 Critérios de aceite AC01–AC06 revisados e objetivos claros
- [ ] CA02 Não-objetivos respeitados — sem mudança em lógica, rotas ou tema

## Segurança / Tenancy

- [ ] SEC01 Nenhuma lógica de negócio ou query alterada — zero risco de vazamento
- [ ] SEC02 Nenhuma permissão/RBAC alterada

## Qualidade

- [ ] QLT01 `grep '<input type="date"' apps/web/src/app/features/**/*.html` → zero resultados
- [ ] QLT02 `npx nx lint web` sem novos erros nos arquivos modificados
- [ ] QLT03 Breadcrumb sem fundo destacado em todas as telas verificadas (AC01)
- [ ] QLT04 Header com título + subtítulo + botão em todas as telas de lista e form/detalhe (AC02/AC03)
- [ ] QLT05 Conteúdo das telas de lista envolvido em `p-card w-full` (AC04)
- [ ] QLT06 Teste responsivo: viewport 375px — header e grids corretos (AC06)
