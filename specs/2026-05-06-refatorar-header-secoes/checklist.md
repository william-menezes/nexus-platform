# Checklist — Refatorar Headers de Seção — PageHeaderComponent

Criada em: 2026-05-06
Referência: `spec.md`

## Produto

- [ ] CA01 Componente aceita `variant="list"` e `variant="detail"` — comportamento distinto por modo
- [ ] CA02 Slot de ações (`[actions]`) funciona com qualquer combinação de botões/links
- [ ] CA03 View toggle aparece e emite evento somente quando `viewToggleOptions` é fornecido
- [ ] CA04 Pills com 6 cores distintas renderizam corretamente
- [ ] CA05 Subtítulo de detalhe suporta conteúdo projetado (links com `routerLink`)
- [ ] CA06 Todas as telas implementadas migradas e visualmente corretas

## UX / Visual

- [ ] UX01 Modo `list`: alinhamento correto (título/subtítulo esquerda, ações direita) em todas as telas migradas
- [ ] UX02 Modo `detail`: link "← Voltar" pequeno e muted; título grande e bold; pills inline no mesmo baseline
- [ ] UX03 Mobile (375px): sem overflow horizontal; ações quebram para linha abaixo do título

## Segurança / Tenancy

- [ ] SEC01 Nenhuma lógica de dado ou auth no componente — puramente presentacional
- [ ] SEC02 `backRoute` é passado como string/array de segmentos — sem interpolação de input de usuário em URL

## Qualidade

- [ ] QLT01 Testes unitários cobrindo renderização condicional de todos os slots e inputs
- [ ] QLT02 `nx lint web` e `nx test web` passando sem erros
- [ ] QLT03 `nx build web` sem erros de compilação TypeScript
- [ ] QLT04 Nenhuma classe Tailwind dinâmica interpolada (pillClasses usa mapa estático)
