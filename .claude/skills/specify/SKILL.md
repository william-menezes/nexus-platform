---
name: specify
description: Spec-Driven Development workflow for SimplificaOS. Use when the user wants to create, update, review, or check specs for a feature. Triggers on "/specify", "spec new", "nova spec", "escrever spec", "criar spec", "spec de <feature>", "quero especificar", or any request to plan a feature before implementation.
license: MIT
metadata:
  author: William
  version: '1.0'
---

# Specify — Skill de SDD para SimplificaOS

## Missão

Guiar o fluxo Spec-Driven Development: toda feature começa com uma spec escrita e aprovada antes de qualquer linha de código.

## Contexto do Projeto

- **Constitution:** `.specify/constitution.md` — princípios e padrões do projeto
- **Templates:** `.specify/templates/` — modelos para spec, plan, tasks, checklist
- **Specs ativas:** `specs/YYYY-MM-DD-<slug>/` — uma pasta por feature
- **Fonte de verdade técnica:** `CLAUDE.md`

---

## Comandos e Comportamentos

### `/specify new <slug>` ou `/specify nova <slug>`

Criar uma nova spec do zero.

**Passos:**
1. Perguntar ao usuário o **título** da feature (se não fornecido).
2. Criar a pasta `specs/YYYY-MM-DD-<slug>/` com a data de hoje.
3. Criar os 4 arquivos a partir dos templates em `.specify/templates/`:
   - `spec.md` — contexto, objetivos, cenários, regras de negócio, critérios de aceite
   - `plan.md` — abordagem, arquitetura, mudanças por camada, riscos
   - `tasks.md` — decomposição em tarefas verificáveis (TSKxxx)
   - `checklist.md` — DoD e pontos de verificação de entrega
4. Preencher os campos que já se conhece a partir do `CLAUDE.md` e da conversa:
   - Projetos Nx afetados (`web`, `api`, `libs/...`)
   - Endpoints e tabelas referenciados na spec técnica
   - Permissões RBAC necessárias
   - Regras de negócio relacionadas (RN01–RN12)
5. Deixar explícito o que falta preencher com `[PREENCHER]`.
6. Abrir o `spec.md` gerado para revisão do usuário.

**Convenção de slug:** `kebab-case`, descritivo, sem datas (a data vai no nome da pasta).
Exemplos: `cadastro-clientes`, `orcamentos-crud`, `controle-caixa`

---

### `/specify list` ou `/specify listar`

Listar todas as specs existentes em `specs/` com status e data.

**Passos:**
1. Ler todas as pastas em `specs/`.
2. Para cada pasta, ler o cabeçalho do `spec.md` (campos `Status` e título).
3. Exibir uma tabela: Slug | Título | Status | Data.

**Status possíveis:** `Draft` | `In Progress` | `Done` | `Cancelled`

---

### `/specify check` ou `/specify verificar`

Verificar qualidade das specs existentes.

**Checar para cada spec:**
- [ ] Pasta segue convenção `YYYY-MM-DD-<slug>`
- [ ] `spec.md` existe e tem Status, contexto, objetivos e pelo menos um critério de aceite
- [ ] `plan.md` existe e tem abordagem e mudanças por camada
- [ ] `tasks.md` existe e tem pelo menos uma tarefa de implementação
- [ ] `checklist.md` existe
- [ ] Nenhum campo `[PREENCHER]` pendente em specs com status `In Progress` ou `Done`

Reportar o que está faltando por spec.

---

### `/specify show <slug>` ou `/specify ver <slug>`

Exibir o conteúdo completo de uma spec.

**Passos:**
1. Encontrar a pasta em `specs/` que contém o slug.
2. Ler e exibir `spec.md`, seguido de `plan.md` e `tasks.md`.

---

### `/specify status <slug> <novo-status>`

Atualizar o status de uma spec.

**Passos:**
1. Localizar `specs/*<slug>*/spec.md`.
2. Atualizar o campo `Status:` para o valor fornecido.
3. Confirmar a alteração.

---

### `/specify plan <slug>`

Preencher ou atualizar o `plan.md` de uma spec existente.

**Passos:**
1. Ler o `spec.md` da feature para entender contexto, objetivos e ACs.
2. Ler `CLAUDE.md` para verificar impacto no schema, endpoints e RBAC.
3. Gerar um `plan.md` completo com:
   - Abordagem escolhida (com justificativa)
   - Mudanças por camada (Angular, NestJS, Supabase, shared libs)
   - Riscos e mitigações
   - Estratégia de validação por AC

---

### `/specify tasks <slug>`

Gerar ou atualizar as `tasks.md` a partir da spec e do plan.

**Passos:**
1. Ler `spec.md` e `plan.md` da feature.
2. Decompor em tarefas atômicas e verificáveis (cada TSK leva < 2h de trabalho).
3. Numerar sequencialmente: `TSK001`, `TSK002` etc.
4. Agrupar em: Preparação → Backend → Frontend → Testes → Entrega.
5. Listar o comando Nx de validação para cada grupo quando aplicável.

---

## Regras de Qualidade para Specs

Uma spec de qualidade segue estes critérios:

| Critério | Obrigatório |
|---|---|
| Contexto explicado (por quê existe) | Sim |
| Pelo menos 1 cenário Given/When/Then | Sim |
| Critérios de aceite verificáveis (AC01, AC02...) | Sim, mínimo 2 |
| Regras de negócio referenciadas (RN01–RN12 do CLAUDE.md) | Quando aplicável |
| Projetos Nx afetados declarados | Sim |
| Impacto em banco/RLS declarado | Quando aplicável |
| Estratégia de rollout descrita | Quando muda auth, pagamento ou multi-tenant |

---

## Fluxo SDD Completo

```
/specify new <slug>    →  spec.md (o quê/por quê)
/specify plan <slug>   →  plan.md (como)
/specify tasks <slug>  →  tasks.md (tarefas verificáveis)
[implementação + testes]
/specify status <slug> Done
```

---

## Referências

- Constitution: `.specify/constitution.md`
- Templates: `.specify/templates/`
- Spec técnica completa: `CLAUDE.md`
- Regras de negócio: `CLAUDE.md` seção 7 (RN01–RN12)
- Schema do banco: `CLAUDE.md` seção 4
- Endpoints: `CLAUDE.md` seção 5
