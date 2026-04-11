# Adoção de SDD (Spec Kit) no repositório

Status: In Progress  
Owner: [definir]  
Criada em: 2026-04-11  
Links: [n/a]

## Contexto

O repositório já usa a ideia de “spec primeiro”, mas faltam convenções e automação leve para tornar o ciclo repetível.

## Objetivos

- Padronizar a estrutura de specs por feature em `specs/`
- Facilitar criar/validar specs via scripts simples (`spec:new`, `spec:check`)
- Documentar o ciclo de desenvolvimento (spec → plan → tasks → implement)

## Critérios de aceite

- AC01 Existe `/.specify/constitution.md` e `/.specify/templates/*`
- AC02 Existe `specs/README.md` e ao menos 1 spec de exemplo
- AC03 `npm run spec:check` passa em CI/local
- AC04 Existe documentação do fluxo SDD para o time

