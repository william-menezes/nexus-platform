# SDD (Spec-Driven Development) com Spec Kit — Nexus Platform

Este repositório segue um fluxo inspirado no **GitHub Spec Kit**: **specify → plan → tasks → implement**.

## Onde ficam as coisas

- Princípios do projeto: `.specify/constitution.md`
- Templates: `.specify/templates/`
- Specs por feature: `specs/YYYY-MM-DD-<slug>/`

## Passo a passo (o “como fazer”)

1) Criar a pasta da feature:

```bash
npm run spec:new -- <slug> --title "Título da feature"
```

2) Preencher `spec.md`

- Contexto, objetivos e não-objetivos
- Cenários (Dado/Quando/Então)
- Critérios de aceite (AC01, AC02...)
- Impacto técnico (web/api/db/shared) e plano de testes

3) Preencher `plan.md`

- Abordagem, decisões e riscos
- Quais projetos Nx serão afetados e como validar

4) Quebrar em `tasks.md`

- Tarefas pequenas, verificáveis e ligadas aos ACs
- Use checkboxes para acompanhar progresso

5) Implementar (código + testes)

- Execute os comandos Nx relevantes (lint/test/build) durante a implementação
- Atualize `tasks.md` e `checklist.md` conforme validações forem concluídas

6) Abrir PR

- O PR deve linkar a spec (`specs/.../spec.md`) e os ACs
- Review verifica: spec clara, tarefas cobrem ACs, testes/CI ok

## Como fica o ciclo de desenvolvimento (depois de adotado)

- **Ideia/bug → Spec**: a spec vira o “contrato” do que será entregue (ACs testáveis).
- **Spec → Plan**: define como entregar sem surpresa (arquitetura, riscos, migrações).
- **Plan → Tasks**: quebra em unidades pequenas (ideal para agentes e para revisão).
- **Tasks → Implementação**: código e testes avançam junto; CI valida e evita regressões.
- **Entrega**: spec marcada como Done quando DoD estiver completo (ver `.specify/constitution.md`).

## Validações

- Local/CI: `npm run spec:check`

