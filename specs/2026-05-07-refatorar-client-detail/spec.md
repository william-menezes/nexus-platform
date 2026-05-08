# Refatoração do Client Detail — Layout de Detalhe de Cliente

Status: In Progress
Owner: [@william]
Criada em: 2026-05-07
Links: Design ref — screenshot anexo na conversa

## Contexto

A tela de detalhe de cliente (`/app/clientes/:id`) usa um layout simples de cards de dados, sem estrutura de abas, sem KPIs de negócio e sem ações rápidas. O novo design traz uma visão operacional completa: avatar + contatos no header, KPIs de relacionamento, timeline unificada, e acesso rápido às principais ações. O objetivo é transformar a tela num hub central do cliente dentro do sistema.

## Objetivos

- [ ] Substituir o layout de cards simples por um hero-card com avatar, nome, contatos e ações
- [ ] Exibir 4 KPIs (OS abertas, OS concluídas, Faturado total, Saldo a receber)
- [ ] Implementar estrutura de abas: Histórico · Ordens de Serviço · Orçamentos · Vendas · Equipamentos
- [ ] Implementar aba Histórico como timeline unificada
- [ ] Implementar aba Ordens de Serviço e Orçamentos com os dados já disponíveis
- [ ] Exibir sidebar com Detalhes (endereço, observações) e Ações rápidas
- [ ] Garantir responsividade mobile

## Não-objetivos

- Implementação de chat/envio de WhatsApp real (só placeholder de ação)
- Edição inline de campos de detalhe
- Paginação das abas nesta iteração
- Abas Vendas e Equipamentos funcionais [PREENCHER — ver Dúvida 3]

## Usuários e cenários

### Cenário 1 — Técnico consulta histórico do cliente ao receber equipamento

**Dado** que um técnico está na tela de detalhe do cliente  
**Quando** o cliente entra com um equipamento  
**Então** o técnico vê de imediato: KPIs, OS em aberto, e pode criar uma Nova OS com o cliente já preenchido

### Cenário 2 — Admin verifica inadimplência

**Dado** que o admin está na tela de detalhe  
**Quando** o campo "Saldo a receber" está destacado em laranja  
**Então** o admin identifica visualmente que há valor pendente sem precisar abrir o financeiro

### Cenário 3 — Usuário navega pelas abas

**Dado** que o usuário clica em "Ordens de Serviço" na barra de abas  
**Então** a lista de OS do cliente é exibida na área de conteúdo (sem recarregar a página)

## Regras de negócio

- RN01 (soft delete): cliente excluído via "Excluir cliente" usa soft delete
- Os KPIs "OS Abertas" e "OS Concluídas" contam apenas OS do cliente logado no tenant (RLS)
- "Saldo a Receber" destacado em `var(--bad)` quando valor > 0 [PREENCHER — confirmar com Dúvida 1]

## Critérios de aceite

- AC01 Hero-card exibe avatar (inicial do nome), nome completo, pill de tipo (PF/PJ), pill de status (Ativo), CPF/CNPJ, telefone, email e data de cadastro
- AC02 Botão "+ Nova OS" navega para o formulário de OS com `clientId` pré-preenchido
- AC03 Botão "Editar" navega para o formulário de edição do cliente
- AC04 Os 4 KPIs são exibidos na linha abaixo do hero-card
- AC05 A aba "Histórico" mostra timeline em ordem cronológica decrescente com itens de OS, orçamentos e o evento de cadastro
- AC06 A aba "Ordens de Serviço" lista as OS do cliente com código, status e data
- AC07 A aba "Orçamentos" lista os orçamentos do cliente com código, status e data
- AC08 Sidebar "Detalhes" exibe cidade, endereço completo e observações
- AC09 Sidebar "Ações rápidas": cada link navega para o formulário correspondente com cliente pré-selecionado
- AC10 "Excluir cliente" abre confirm dialog antes de deletar (soft delete)
- AC11 Layout responsivo: em mobile a sidebar vai abaixo do conteúdo principal
- AC12 Zero `style=""` inline — tudo Tailwind ou tokens CSS

## Impacto técnico (rascunho)

- Projetos Nx afetados: `web`
- API: [PREENCHER — endpoint de summary/KPIs? Dúvida 1] [PREENCHER — endpoint de histórico unificado? Dúvida 2]
- Banco: sem alterações de schema (leitura de dados existentes)
- Permissões (RBAC): `clients:read` (já existe)
- Observabilidade: sem impacto

## Dados do layout (derivados do design)

### Hero-card
```
[Avatar — inicial do nome, círculo 56px bg-primary-100 text-primary font-bold text-xl]
[Nome] · [pill PF/PJ] · [pill Ativo/Inativo]
CPF/CNPJ · Telefone · Email · Cliente desde DD/MM/YYYY
[Ação: ☎] [Ação: WhatsApp] [Ação: Email] [Editar outlined] [+ Nova OS primary]
```

### KPI bar
```
OS ABERTAS   |   OS CONCLUÍDAS   |   FATURADO TOTAL   |   SALDO A RECEBER
     2        |         7          |    R$ 4.820,00     |    R$ 480,00 (bad)
```

### Abas
```
Histórico (N) | Ordens de Serviço (N) | Orçamentos (N) | Vendas (N) | Equipamentos (N)
```

### Timeline item (aba Histórico)
```
[ícone] [código · descrição curta] [pill status]
[data · hora] · por [responsável]
[subtexto / observação]
```

### Sidebar
```
┌ Detalhes  [✎] ─────────────────────────┐
│ CIDADE                                  │
│ Uberlândia · MG                         │
│ ENDEREÇO                                │
│ Rua das Acácias, 142 · Bairro Centro    │
│ CEP 38400-100                           │
│ OBSERVAÇÕES                             │
│ Texto livre                             │
└─────────────────────────────────────────┘

┌ Ações rápidas ─────────────────────────┐
│ 📄 Novo orçamento                       │
│ 🛒 Nova venda                           │
│ 🖥 Cadastrar equipamento                │
│ ✉ Enviar mensagem                       │
│ ─────────────────────────────────────   │
│ 🗑 Excluir cliente (bad color)          │
└─────────────────────────────────────────┘
```

## Plano de testes

- Unit: não aplicável (componente visual)
- Integração: não aplicável (sem mudança de API nesta fase)
- E2E/manual: verificar todas as abas, KPIs, navegação de ações rápidas, responsividade mobile

## Rollout

- Feature flag: não
- Backwards compatibility: substitui o HTML do componente, sem impacto em rotas ou serviços
- Migrações: não
