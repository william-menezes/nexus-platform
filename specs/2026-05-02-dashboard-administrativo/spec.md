# Dashboard Administrativo (SUPER_ADMIN)

Status: Draft  
Owner: [@william]  
Criada em: 2026-05-02  
Links: [CLAUDE.md §2.3, §5.3, §6.3]

## Contexto

O SimplificaOS precisa de um painel administrativo cross-tenant para o papel `SUPER_ADMIN`. Esse painel permite monitorar e gerenciar todos os tenants da plataforma, definir planos e seus módulos, revogar assinaturas, criar cupons de desconto e visualizar métricas globais do produto (MRR, churn, total tenants).

As contas `williamenezes@outlook.com` e `simplificaos01@gmail.com` devem ser provisionadas como SUPER_ADMIN via seed/migration, sem precisar de um tenant associado.

O SUPER_ADMIN **não** realiza operações de tenant (criar OS, cliente, venda, etc.) — essa é uma restrição fundamental de design descrita na spec (CLAUDE.md §2.3).

## Objetivos

- [ ] Autenticar com contas SUPER_ADMIN dedicadas
- [ ] Listar todos os tenants com filtros e busca
- [ ] Gerenciar tenant individualmente (plano, status, trial, subscription)
- [ ] Criar, editar e arquivar planos com definição de módulos por plano
- [ ] Revogar/cancelar assinatura de um tenant
- [ ] Criar e gerenciar cupons de desconto
- [ ] Visualizar métricas globais (MRR, churn, total tenants ativos, etc.)

## Não-objetivos

- Criar OS, clientes, vendas ou qualquer operação de tenant-specific
- Impersonar um tenant (acessar o painel deles)
- Gerenciar usuários individuais de um tenant (isso é papel do TENANT_ADMIN)
- Gateway de pagamento real na MVP (colunas de gateway ficam `null`)

## Usuários e cenários

### Cenário 1 — Login como SUPER_ADMIN

**Dado** que existo como SUPER_ADMIN (williamenezes@outlook.com ou simplificaos01@gmail.com)  
**Quando** faço login em `/login` com credenciais válidas  
**Então** sou redirecionado para `/admin/dashboard` (e não para `/app/dashboard`)

### Cenário 2 — Listar e filtrar tenants

**Dado** que estou no `/admin/tenants`  
**Quando** busco por nome "Tech" ou filtro por plano "trial"  
**Então** vejo apenas os tenants que correspondem ao filtro, com colunas: nome, plano, status, trial_ends_at, criado_em, usuários ativos

### Cenário 3 — Detalhe e edição de tenant

**Dado** que estou em `/admin/tenants/:id`  
**Quando** altero o plano de "trial" para "pro" e salvo  
**Então** o tenant passa a ter acesso aos módulos do plano "pro" imediatamente; um evento é logado em `audit_logs`

### Cenário 4 — Estender trial

**Dado** que estou em `/admin/tenants/:id` e o trial está expirando  
**Quando** clico em "Estender trial" e informo quantos dias  
**Então** `tenants.trial_ends_at` é atualizado; o tenant recupera acesso de escrita se estava bloqueado

### Cenário 5 — Revogar assinatura

**Dado** que um tenant está com `subscription.status = 'active'`  
**Quando** clico em "Revogar assinatura" e confirmo  
**Então** `subscription.status` passa para `'cancelled'`; o tenant perde acesso de escrita na próxima verificação do guard de trial (RN05)

### Cenário 6 — Criar plano

**Dado** que estou em `/admin/planos`  
**Quando** clico em "Novo Plano", informo nome, preço, limites e seleciono os módulos permitidos  
**Então** o plano é salvo e fica disponível para ser atribuído a tenants

### Cenário 7 — Configurar módulos de um plano

**Dado** que estou editando o plano "starter"  
**Quando** desmarco o módulo "financial" e salvo  
**Então** tenants no plano "starter" não veem mais o módulo financeiro no menu; o guard de permissão bloqueia os endpoints correspondentes

### Cenário 8 — Criar cupom de desconto

**Dado** que estou em `/admin/cupons`  
**Quando** preencho código "PROMO10", tipo "percentage", valor 10, validade e limite de usos e salvo  
**Então** o cupom é criado e pode ser aplicado na tela de upgrade/pagamento de um tenant

### Cenário 9 — Métricas globais

**Dado** que estou em `/admin/dashboard`  
**Quando** a página carrega  
**Então** vejo: total tenants ativos, total em trial, total pagantes, MRR calculado, novos tenants (últimos 30 dias), churn dos últimos 30 dias

## Regras de negócio

- **RN-ADM01** — SUPER_ADMIN é identificado via tabela `super_admins` (sem tenant_id). O login usa Supabase Auth; após autenticar, o sistema consulta `super_admins` pela `user_id` para confirmar o papel.
- **RN-ADM02** — SUPER_ADMIN não pode acessar rotas `/app/*`; tentativa redireciona para `/admin/dashboard`.
- **RN-ADM03** — Alteração de plano tem efeito imediato: o guard de permissão relê `tenants.plan` a cada request.
- **RN-ADM04** — Revogação de assinatura não deleta dados; apenas altera `subscription.status`. O tenant pode reativar pagando.
- **RN-ADM05** — Cupons têm: código único (case-insensitive), tipo (`percentage` | `fixed`), valor, `valid_until` opcional, `max_uses` opcional, `uses_count` (contador). Cupom expirado ou esgotado retorna erro de validação.
- **RN-ADM06** — MRR = soma de `subscriptions.plan` × preço do plano onde `status = 'active'`. Calculado em tempo real.
- **RN-ADM07** — Ações do SUPER_ADMIN (alterar plano, revogar, estender trial) são registradas em `audit_logs` com `tenant_id` do tenant afetado e `user_id` do admin.
- **RN-ADM08** — Módulos de um plano são definidos como lista de strings em `plans.modules` (JSONB). O PermissionGuard verifica se o módulo está na lista do plano do tenant.

## Critérios de aceite

- **AC01** — Login com williamenezes@outlook.com e simplificaos01@gmail.com redireciona para `/admin/dashboard`; qualquer outra conta sem SUPER_ADMIN recebe 403.
- **AC02** — `/admin/tenants` lista todos os tenants com paginação, busca por nome e filtro por plano/status.
- **AC03** — Alterar plano de um tenant em `/admin/tenants/:id` persiste imediatamente e aparece na listagem.
- **AC04** — "Estender trial" atualiza `trial_ends_at` e o tenant bloqueado recupera acesso ao recarregar.
- **AC05** — "Revogar assinatura" muda `subscription.status` para `'cancelled'` e aparece na tela do tenant.
- **AC06** — Criar plano em `/admin/planos` com módulos selecionados; plano aparece na lista e pode ser atribuído a tenants.
- **AC07** — Editar módulos de um plano existente; tenant nesse plano imediatamente perde/ganha acesso ao módulo.
- **AC08** — Criar cupom em `/admin/cupons`; cupom aparece na lista com código, tipo, valor, usos e validade.
- **AC09** — Métricas no `/admin/dashboard` exibem totais corretos (validar com dados de seed).
- **AC10** — Toda ação administrativa (alterar plano, revogar, estender trial) gera linha em `audit_logs`.

## Impacto técnico (rascunho)

- **Projetos Nx afetados:** `web`, `api`, `libs/shared-types`
- **API endpoints novos/modificados:**
  - `GET/PATCH /api/admin/tenants`, `GET/PATCH /api/admin/tenants/:id`
  - `GET /api/admin/metrics`
  - `GET/POST/PUT/DELETE /api/admin/plans`
  - `GET/POST/PATCH/DELETE /api/admin/coupons`
  - `POST /api/admin/tenants/:id/revoke-subscription`
  - `POST /api/admin/tenants/:id/extend-trial`
- **Banco — tabelas novas:**
  - `super_admins` — mapeia `user_id` (Supabase Auth) para papel SUPER_ADMIN (sem tenant_id)
  - `plans` — definição de planos: nome, preço, limites, módulos (JSONB)
  - `coupons` — cupons de desconto com código, tipo, valor, validade, contadores
- **Banco — alterações:**
  - `tenants.plan` deve referenciar `plans.slug` (manter compatibilidade com CHECK existente ou migrar para FK)
- **Permissões (RBAC):** nova guard `SuperAdminGuard` separada do `PermissionGuard` tenant-scoped
- **Observabilidade:** `audit_logs` para todas as ações do admin (RN-ADM07)

## Plano de testes

- **Unit:** SuperAdminGuard (bloqueia não-admin), CouponsService (validação expiração/esgotamento), PlansService (módulos)
- **Integração:** endpoints `/api/admin/*` com usuário SUPER_ADMIN vs. TENANT_ADMIN (403 esperado)
- **E2E/manual:** login com williamenezes@outlook.com → navegar para /admin → alterar plano de tenant → verificar efeito

## Rollout

- Feature flag? não — é funcionalidade nova sem impacto no fluxo tenant
- Backwards compatibility: `plans` table é nova; tenants existentes migram o campo `plan` (string) para referenciar a nova tabela
- Migrações: criar `super_admins`, `plans`, `coupons`; seed de 2 contas SUPER_ADMIN; seed de planos padrão (trial, starter, pro, enterprise)
