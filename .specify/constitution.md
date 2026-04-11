# Constituição (SDD) — Nexus Platform

Esta constituição governa como especificamos, planejamos e implementamos mudanças no repositório.

## 1) Regra de ouro

- **Spec primeiro, código depois.** Toda feature começa com uma spec em `specs/`.
- Se a regra de negócio **não está escrita**, não assuma: **pergunte e atualize a spec**.

## 2) Fonte de verdade

- **Diretrizes do agente e convenções**: `AGENTS.md`
- **Contexto funcional do produto** (alto nível): `CLAUDE.md` e `docs/` (quando aplicável)
- **Fonte de verdade da feature em andamento**: `specs/<feature>/spec.md`

## 3) Qualidade e verificação

- **TDD quando fizer sentido**: escreva/ajuste testes antes ou junto da implementação.
- Critérios de aceite devem ser **testáveis** (manual ou automatizado) e virar itens em `tasks.md`.
- Mudanças de UI (em `apps/web/` e `libs/ui-components/`) devem respeitar o design system Nexus Clean
  conforme `/.claude/skills/clean/SKILL.md` e as convenções do repo (Angular standalone, PrimeNG, Tailwind).

## 4) Compatibilidade com Nx

- Prefira comandos Nx para execução: `npx nx affected ...`, `npx nx test ...`, `npx nx lint ...`.
- Specs devem sempre declarar quais projetos Nx são impactados (quando conhecido).

## 5) Definição de pronto (DoD)

Uma feature só pode ser marcada como **Done** na spec quando:

- Critérios de aceite atendidos e verificados
- Testes/lint relevantes passando
- Documentação/UX ajustadas quando necessário
- Riscos e rollout descritos quando houver mudança sensível (auth, pagamentos, multi-tenant, etc.)

