# Spec-Driven Development (Spec Kit) no Nexus Platform

Este repositório adota um fluxo inspirado no **GitHub Spec Kit**:

1. **specify**: escrever a spec (o que/por quê + critérios de aceite)
2. **plan**: planejar a implementação (como)
3. **tasks**: decompor em tarefas pequenas e verificáveis
4. **implement**: implementar + testar + validar contra a spec

Artefatos e convenções ficam em:

- `/.specify/constitution.md` (princípios do projeto)
- `/.specify/templates/` (templates de spec/plan/tasks/checklists)
- `/specs/` (specs por feature)

Criação rápida de uma nova spec:

```bash
npm run spec:new -- <slug> --title "Título da feature"
```

Validação (local e CI):

```bash
npm run spec:check
```

