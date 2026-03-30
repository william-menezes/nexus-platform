# Nexus Platform — Spec Completa (Spec-Driven Development)

> **Versão:** 1.0 · **Data:** 2026-03-28
> **Abordagem:** Spec-Driven Development + TDD
> **Referência de mercado:** AgoraOS (agoraos.com.br)

---

## 1. Visão Geral

**Nexus Platform** é um SaaS multi-tenant para empresas de assistência técnica e serviços no Brasil.
Gerencia o ciclo completo: cadastro de clientes → orçamento → aprovação → OS → execução → venda/faturamento → financeiro.

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Angular 21 + SSR + PrimeNG 21 + TailwindCSS |
| Backend | NestJS 11 + TypeORM |
| Banco | PostgreSQL via Supabase (RLS multi-tenant) |
| Auth | Supabase Auth (JWT) |
| Monorepo | Nx 22.6 |
| Deploy | Vercel (web) + Render/Docker (API) |
| CI/CD | GitHub Actions |
| Pagamento | Stripe ou AbacatePay (TBD) |

### Princípios

- **Spec primeiro, código depois.** Toda feature começa com spec + critérios de aceite.
- **TDD obrigatório.** Escrever testes antes da implementação.
- **Isolamento multi-tenant.** RLS no banco + middleware no NestJS. Zero vazamento.
- **Soft delete em todas as entidades.** `deleted_at` timestamp (RN01).
- **Audit trail.** Toda ação relevante é logada (quem, quando, o quê).
- **Sem presunção.** Se a regra de negócio não está na spec, perguntar antes de implementar.

---

## 2. Roles & Permissões (RBAC Granular)

### 2.1 Roles

| Role | Escopo | Descrição |
|---|---|---|
| `SUPER_ADMIN` | Cross-tenant | Vê todos os tenants. Gerencia planos, módulos, assinaturas. **Não** faz operações de tenant (criar OS, clientes, etc.) |
| `TENANT_ADMIN` | Próprio tenant | Acesso total às operações do seu tenant. Configura equipamentos, campos, checklists, status, permissões. |
| `TECNICO` | Próprio tenant | Cria e gerencia OS e clientes. |
| `VENDEDOR` | Próprio tenant | Vendas, controle de caixa, trocas e devoluções. |

### 2.2 Matriz de Permissões (Default)

Cada permissão = `módulo:ação`. O `SUPER_ADMIN` define quais módulos cada plano de tenant libera.
O `TENANT_ADMIN` pode criar roles customizados e atribuir permissões granulares.

| Módulo | Ação | TENANT_ADMIN | TECNICO | VENDEDOR |
|---|---|---|---|---|
| clients | create, read, update, delete | ✅ | ✅ | read |
| quotes | create, read, update, delete, send, approve | ✅ | ✅ | read |
| service_orders | create, read, update, delete, change_status | ✅ | ✅ | read |
| equipments | create, read, update, delete | ✅ | ✅ | read |
| sales | create, read, update, cancel | ✅ | read | ✅ |
| returns | create, read | ✅ | ❌ | ✅ |
| cash_register | open, close, read, withdraw | ✅ | ❌ | ✅ |
| products | create, read, update, delete | ✅ | read | read |
| services_catalog | create, read, update, delete | ✅ | read | read |
| inventory | read, entry, adjust | ✅ | read | read |
| purchase_orders | create, read, update, delete | ✅ | ❌ | ❌ |
| financial | create, read, update, delete | ✅ | ❌ | ❌ |
| contracts | create, read, update, delete | ✅ | read | read |
| reports | read | ✅ | ❌ | ❌ |
| settings | read, update | ✅ | ❌ | ❌ |
| employees | create, read, update, delete | ✅ | ❌ | ❌ |
| audit_logs | read | ✅ | ❌ | ❌ |

### 2.3 SUPER_ADMIN — Painel Administrativo

**Funcionalidades:**
- Listar todos os tenants (nome, plano, status, data criação, trial_ends_at)
- Alterar plano de um tenant
- Ativar/desativar tenant
- Estender período de trial
- Definir quais módulos cada plano libera
- Visualizar métricas globais (total tenants, MRR, churn)
- **Não pode:** criar OS, clientes, vendas, ou qualquer operação tenant-specific

---

## 3. Onboarding & Subscription

### 3.1 Fluxo de Signup

```
1. Usuário acessa /cadastro
2. Preenche: nome pessoal, email, senha, confirmar senha
3. Cria conta no Supabase Auth
4. Tela de setup da empresa:
   - Nome da empresa
   - CNPJ (opcional)
   - Telefone
   - Nicho/segmento (seleção: eletrônicos, climatização, informática, automotivo, genérico)
   - Upload de logo da empresa (imagem PNG/JPG, max 2MB)
5. Sistema cria:
   - Registro em `tenants` (plano = 'trial', trial_ends_at = NOW() + 7 dias)
   - Registro em `tenant_users` (role = 'TENANT_ADMIN')
   - Status padrões para OS/vendas/orçamentos
   - Plano de contas padrão
6. Redireciona para /app/dashboard
```

### 3.2 Trial de 7 Dias

| Dia | Comportamento |
|---|---|
| 1-5 | Acesso completo a todos os módulos |
| 5 | Notificação: "Faltam 2 dias para o fim do trial" |
| 7 | Bloqueia operações de escrita (leitura mantida) |
| 7+ | Tela de upgrade com planos + form de pagamento |

Após pagamento:
- `subscriptions.status` = 'active'
- Dados do trial são preservados
- SUPER_ADMIN pode estender trial manualmente

### 3.3 Planos

| Plano | Limite OS | Limite Usuários | Módulos | Preço (sugestão) |
|---|---|---|---|---|
| `trial` | 20 | 2 | Todos (7 dias) | Grátis |
| `starter` | 100 | 3 | OS, Vendas, Estoque básico | R$ 49/mês |
| `pro` | 1.000 | 10 | Todos | R$ 99/mês |
| `enterprise` | Ilimitado | Ilimitado | Todos + API + Suporte | R$ 199/mês |

### 3.4 Logo da Empresa

- Upload no onboarding e editável em Settings
- Armazenada no Supabase Storage (bucket: `tenant-logos`)
- Path: `{tenant_id}/logo.{ext}`
- Usada em: PDFs de orçamento, OS, recibos, contratos
- Fallback: logo genérica Nexus quando não há upload

---

## 4. Database Schema

### 4.1 Convenções

- **PK:** UUID auto-gerado (`gen_random_uuid()`)
- **Tenant isolation:** Toda tabela tem `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- **RLS:** Toda tabela tem política `USING (tenant_id = current_tenant_id())`
- **Soft delete:** `deleted_at TIMESTAMPTZ` em entidades principais
- **Timestamps:** `created_at`, `updated_at` com trigger automático
- **Nomenclatura:** snake_case no banco, camelCase no TypeScript
- **Índices:** Sempre em `tenant_id` + colunas filtradas frequentemente

---

### 4.2 CORE — Tabelas de Infraestrutura

#### `tenants` (existente — refatorar)

```sql
CREATE TABLE public.tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  cnpj          TEXT,
  phone         TEXT,
  segment       TEXT DEFAULT 'generic'
                CHECK (segment IN ('electronics','hvac','it','automotive','generic')),
  logo_url      TEXT,                     -- URL no Supabase Storage
  plan          TEXT NOT NULL DEFAULT 'trial'
                CHECK (plan IN ('trial','starter','pro','enterprise')),
  plan_limits   JSONB NOT NULL DEFAULT '{"max_os": 100, "max_users": 3}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ,              -- NOVO: data fim do trial
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
```

#### `tenant_users` (existente — refatorar)

```sql
CREATE TABLE public.tenant_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'TECNICO'
             CHECK (role IN ('SUPER_ADMIN','TENANT_ADMIN','TECNICO','VENDEDOR')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);
```

#### `permissions` (NOVO)

```sql
CREATE TABLE public.permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  role       TEXT NOT NULL,
  module     TEXT NOT NULL,          -- ex: 'clients', 'sales', 'financial'
  actions    TEXT[] NOT NULL,        -- ex: {'create','read','update','delete'}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, role, module)
);
-- RLS: tenant_id = current_tenant_id()
```

#### `audit_logs` (NOVO)

```sql
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID NOT NULL,
  action      TEXT NOT NULL,          -- 'create', 'update', 'delete', 'status_change', 'login'
  entity      TEXT NOT NULL,          -- 'service_order', 'sale', 'client', etc.
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(tenant_id, entity, entity_id);
CREATE INDEX idx_audit_logs_user   ON audit_logs(tenant_id, user_id);
-- RLS: tenant_id = current_tenant_id()
-- Sem soft delete — logs são imutáveis
```

#### `custom_statuses` (NOVO)

```sql
CREATE TABLE public.custom_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service_order','sale','quote')),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6B7280', -- hex color
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,  -- status inicial ao criar
  is_final    BOOLEAN NOT NULL DEFAULT FALSE,  -- indica conclusão
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,  -- não pode deletar
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_custom_statuses_tenant ON custom_statuses(tenant_id, entity_type);
-- RLS: tenant_id = current_tenant_id()
```

**Status padrão criados no onboarding:**

Para `service_order`:
| Nome | Cor | is_default | is_final | is_system |
|---|---|---|---|---|
| Aberta | #3B82F6 (blue) | ✅ | ❌ | ✅ |
| Em andamento | #F59E0B (amber) | ❌ | ❌ | ✅ |
| Aguardando peça | #8B5CF6 (violet) | ❌ | ❌ | ✅ |
| Concluída | #10B981 (green) | ❌ | ✅ | ✅ |
| Cancelada | #EF4444 (red) | ❌ | ✅ | ✅ |

Para `quote`:
| Nome | Cor | is_default | is_final | is_system |
|---|---|---|---|---|
| Rascunho | #6B7280 (gray) | ✅ | ❌ | ✅ |
| Enviado | #3B82F6 (blue) | ❌ | ❌ | ✅ |
| Aprovado | #10B981 (green) | ❌ | ✅ | ✅ |
| Rejeitado | #EF4444 (red) | ❌ | ✅ | ✅ |
| Expirado | #9CA3AF (gray) | ❌ | ✅ | ✅ |

Para `sale`:
| Nome | Cor | is_default | is_final | is_system |
|---|---|---|---|---|
| Aberta | #3B82F6 (blue) | ✅ | ❌ | ✅ |
| Paga | #10B981 (green) | ❌ | ✅ | ✅ |
| Cancelada | #EF4444 (red) | ❌ | ✅ | ✅ |

#### `tenant_settings` (NOVO)

```sql
CREATE TABLE public.tenant_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID UNIQUE NOT NULL REFERENCES tenants(id),
  quote_validity_days  INTEGER NOT NULL DEFAULT 30,
  warranty_days        INTEGER NOT NULL DEFAULT 90,
  currency             TEXT NOT NULL DEFAULT 'BRL',
  timezone             TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  os_code_prefix       TEXT NOT NULL DEFAULT 'OS',
  quote_code_prefix    TEXT NOT NULL DEFAULT 'ORC',
  sale_code_prefix     TEXT NOT NULL DEFAULT 'VND',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: tenant_id = current_tenant_id()
```

#### `subscriptions` (NOVO)

```sql
CREATE TABLE public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID UNIQUE NOT NULL REFERENCES tenants(id),
  plan            TEXT NOT NULL DEFAULT 'trial',
  status          TEXT NOT NULL DEFAULT 'trial'
                  CHECK (status IN ('trial','active','past_due','cancelled','expired')),
  trial_ends_at   TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  gateway_provider     TEXT,          -- 'stripe' ou 'abacatepay'
  gateway_subscription_id TEXT,       -- ID externo
  gateway_customer_id     TEXT,       -- ID do customer externo
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: tenant_id = current_tenant_id()
```

---

### 4.3 CADASTROS — Entidades Base

#### `clients` (NOVO)

```sql
CREATE TABLE public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'individual'
              CHECK (type IN ('individual','company')),
  cpf_cnpj    TEXT,
  email       TEXT,
  phone       TEXT,
  phone2      TEXT,
  address     JSONB DEFAULT '{}',
  -- address: { street, number, complement, neighborhood, city, state, zip_code }
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_cpf    ON clients(tenant_id, cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;
CREATE INDEX idx_clients_name   ON clients(tenant_id, name);
-- RLS: tenant_id = current_tenant_id()
```

#### `employees` (NOVO)

```sql
CREATE TABLE public.employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID REFERENCES auth.users(id),  -- vínculo opcional com login
  name            TEXT NOT NULL,
  role_label      TEXT,               -- "Técnico", "Vendedor", "Gerente"
  phone           TEXT,
  email           TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 0,  -- percentual ex: 10.00 = 10%
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `suppliers` (NOVO)

```sql
CREATE TABLE public.suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  cnpj        TEXT,
  contact     TEXT,
  phone       TEXT,
  email       TEXT,
  address     JSONB DEFAULT '{}',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `services` (NOVO — catálogo de serviços)

```sql
CREATE TABLE public.services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  description     TEXT,
  default_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(5,2),         -- duração estimada em horas
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_services_tenant ON services(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `equipment_types` (NOVO)

```sql
CREATE TABLE public.equipment_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL,           -- "Celular", "Notebook", "Ar-condicionado"
  fields_schema JSONB NOT NULL DEFAULT '[]',
  -- fields_schema: [
  --   { "name": "imei", "label": "IMEI", "type": "text", "required": true },
  --   { "name": "serial", "label": "Nº Série", "type": "text", "required": false },
  --   { "name": "color", "label": "Cor", "type": "select", "options": ["Preto","Branco","Azul"] }
  -- ]
  -- Tipos suportados: text, number, date, select, checkbox
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_equipment_types_tenant ON equipment_types(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `equipments` (NOVO)

```sql
CREATE TABLE public.equipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  equipment_type_id UUID NOT NULL REFERENCES equipment_types(id),
  client_id         UUID REFERENCES clients(id),
  brand             TEXT,
  model             TEXT,
  fields_data       JSONB NOT NULL DEFAULT '{}',
  -- fields_data: { "imei": "123456789", "serial": "ABC123", "color": "Preto" }
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_equipments_tenant ON equipments(tenant_id);
CREATE INDEX idx_equipments_client ON equipments(client_id);
CREATE INDEX idx_equipments_type   ON equipments(equipment_type_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `custom_field_definitions` (NOVO)

```sql
CREATE TABLE public.custom_field_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('client','service_order','sale','product','quote')),
  name          TEXT NOT NULL,           -- identificador: "warranty_type"
  label         TEXT NOT NULL,           -- exibição: "Tipo de Garantia"
  field_type    TEXT NOT NULL CHECK (field_type IN ('text','number','date','select','checkbox','textarea')),
  options       JSONB,                   -- para select: ["Opção A","Opção B"]
  is_required   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_custom_field_defs_tenant ON custom_field_definitions(tenant_id, entity_type);
-- RLS: tenant_id = current_tenant_id()
```

---

### 4.4 ORÇAMENTOS

#### `checklist_templates` (NOVO)

```sql
CREATE TABLE public.checklist_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,            -- "Checklist Celular", "Checklist Notebook"
  items       JSONB NOT NULL DEFAULT '[]',
  -- items: [
  --   { "label": "Tela sem trincas", "type": "checkbox" },
  --   { "label": "Liga normalmente", "type": "checkbox" },
  --   { "label": "Acessórios entregues", "type": "text" },
  --   { "label": "Observações visuais", "type": "textarea" }
  -- ]
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_checklist_templates_tenant ON checklist_templates(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `quotes` (NOVO)

```sql
CREATE TABLE public.quotes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  code                  TEXT NOT NULL,           -- auto: "ORC-XXXXXX"
  client_id             UUID NOT NULL REFERENCES clients(id),
  status_id             UUID NOT NULL REFERENCES custom_statuses(id),
  employee_id           UUID REFERENCES employees(id),    -- técnico responsável
  equipment_id          UUID REFERENCES equipments(id),
  checklist_template_id UUID REFERENCES checklist_templates(id),
  checklist_data        JSONB DEFAULT '[]',      -- checklist preenchido
  description           TEXT,
  subtotal              NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until           DATE,                    -- data de validade
  sent_at               TIMESTAMPTZ,             -- quando foi enviado ao cliente
  approved_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  converted_to_os_id    UUID,                    -- referência à OS gerada
  notes                 TEXT,
  custom_fields         JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(tenant_id, status_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `quote_items` (NOVO)

```sql
CREATE TABLE public.quote_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','service')),
  product_id  UUID REFERENCES products(id),
  service_id  UUID REFERENCES services(id),
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  discount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
-- RLS via parent: quote_id IN (SELECT id FROM quotes WHERE tenant_id = current_tenant_id())
```

---

### 4.5 ORDENS DE SERVIÇO (refatorar existente)

#### `service_orders` (REFATORAR)

```sql
-- Campos a ADICIONAR na tabela existente:
ALTER TABLE public.service_orders
  ADD COLUMN client_id     UUID REFERENCES clients(id),
  ADD COLUMN quote_id      UUID REFERENCES quotes(id),
  ADD COLUMN employee_id   UUID REFERENCES employees(id),   -- técnico responsável
  ADD COLUMN status_id     UUID REFERENCES custom_statuses(id),
  ADD COLUMN contract_id   UUID REFERENCES contracts(id);

-- Campos a REMOVER (após migração de dados):
-- client_name  → migrar para clients
-- client_phone → migrar para clients
-- status       → migrar para custom_statuses (status_id)

-- Manter: code, description, custom_fields, price_ideal, price_effective,
--         delivered_at, warranty_until, tenant_id, timestamps, soft delete
```

#### `so_equipments` (NOVO)

```sql
CREATE TABLE public.so_equipments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  equipment_id     UUID NOT NULL REFERENCES equipments(id),
  checklist_data   JSONB DEFAULT '[]',    -- checklist do equipamento nesta OS
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_so_equipments_so ON so_equipments(service_order_id);
-- RLS via parent
```

#### `so_items` (NOVO)

```sql
CREATE TABLE public.so_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  item_type        TEXT NOT NULL CHECK (item_type IN ('product','service')),
  product_id       UUID REFERENCES products(id),
  service_id       UUID REFERENCES services(id),
  description      TEXT NOT NULL,
  quantity         NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price       NUMERIC(10,2) NOT NULL,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price      NUMERIC(10,2) NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_so_items_so ON so_items(service_order_id);
-- RLS via parent
```

#### `so_time_entries` (NOVO)

```sql
CREATE TABLE public.so_time_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  employee_id      UUID NOT NULL REFERENCES employees(id),
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,              -- calculado: ended_at - started_at
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_so_time_entries_so ON so_time_entries(service_order_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `so_attachments` (NOVO)

```sql
CREATE TABLE public.so_attachments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  file_url         TEXT NOT NULL,        -- URL no Supabase Storage
  file_type        TEXT,                 -- 'image/png', 'application/pdf', etc.
  file_size        INTEGER,              -- bytes
  uploaded_by      UUID NOT NULL,        -- user_id
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_so_attachments_so ON so_attachments(service_order_id);
-- RLS: tenant_id = current_tenant_id()
```

---

### 4.6 VENDAS (refatorar existente)

#### `sales` (REFATORAR)

```sql
-- Campos a ADICIONAR:
ALTER TABLE public.sales
  ADD COLUMN client_id   UUID REFERENCES clients(id),
  ADD COLUMN employee_id UUID REFERENCES employees(id),  -- vendedor
  ADD COLUMN status_id   UUID REFERENCES custom_statuses(id),
  ADD COLUMN code        TEXT,                            -- auto: "VND-XXXXXX"
  ADD COLUMN notes       TEXT;

-- Campo a REMOVER (após migração):
-- status → migrar para custom_statuses (status_id)
```

#### `sale_items` (existente — ajustar)

```sql
-- Campos a ADICIONAR:
ALTER TABLE public.sale_items
  ADD COLUMN item_type   TEXT DEFAULT 'product' CHECK (item_type IN ('product','service')),
  ADD COLUMN service_id  UUID REFERENCES services(id),
  ADD COLUMN discount    NUMERIC(10,2) NOT NULL DEFAULT 0;  -- desconto por item
```

#### `returns` (NOVO)

```sql
CREATE TABLE public.returns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  sale_id       UUID NOT NULL REFERENCES sales(id),
  code          TEXT NOT NULL,           -- auto: "DEV-XXXXXX"
  type          TEXT NOT NULL CHECK (type IN ('refund','credit','exchange')),
  reason        TEXT NOT NULL,           -- motivo obrigatório
  total_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(10,2) DEFAULT 0, -- valor em crédito para o cliente
  refund_amount NUMERIC(10,2) DEFAULT 0, -- valor estornado
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','completed','rejected')),
  processed_by  UUID REFERENCES employees(id),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_returns_tenant ON returns(tenant_id);
CREATE INDEX idx_returns_sale   ON returns(sale_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `return_items` (NOVO)

```sql
CREATE TABLE public.return_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id  UUID NOT NULL REFERENCES sale_items(id),
  product_id    UUID REFERENCES products(id),
  quantity      INTEGER NOT NULL,
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL,
  -- Para exchange: novo produto
  exchange_product_id UUID REFERENCES products(id),
  exchange_quantity   INTEGER,
  exchange_unit_price NUMERIC(10,2),
  exchange_total      NUMERIC(10,2)
);
CREATE INDEX idx_return_items_return ON return_items(return_id);
-- RLS via parent
```

---

### 4.7 CONTRATOS

#### `contracts` (NOVO)

```sql
CREATE TABLE public.contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  code              TEXT NOT NULL,             -- auto: "CTR-XXXXXX"
  client_id         UUID NOT NULL REFERENCES clients(id),
  type              TEXT NOT NULL CHECK (type IN ('fixed','hourly_franchise')),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','suspended','cancelled','expired')),
  description       TEXT,
  -- Para type = 'fixed':
  monthly_value     NUMERIC(10,2),
  -- Para type = 'hourly_franchise':
  franchise_hours   NUMERIC(6,2),             -- horas incluídas no plano
  hour_excess_price NUMERIC(10,2),            -- preço da hora excedente
  -- Período:
  start_date        DATE NOT NULL,
  end_date          DATE,                     -- NULL = indeterminado
  billing_day       INTEGER DEFAULT 1,        -- dia do faturamento (1-28)
  -- Reajuste:
  adjustment_rate   NUMERIC(5,2) DEFAULT 0,   -- % de reajuste anual
  last_adjustment   DATE,
  next_billing_at   TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `contract_billing` (NOVO)

```sql
CREATE TABLE public.contract_billing (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  contract_id   UUID NOT NULL REFERENCES contracts(id),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  base_amount   NUMERIC(10,2) NOT NULL,
  excess_hours  NUMERIC(6,2) DEFAULT 0,
  excess_amount NUMERIC(10,2) DEFAULT 0,
  total_amount  NUMERIC(10,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','billed','paid','cancelled')),
  financial_entry_id UUID REFERENCES financial_entries(id),
  billed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contract_billing_contract ON contract_billing(contract_id);
-- RLS: tenant_id = current_tenant_id()
```

---

### 4.8 ESTOQUE (refatorar + ampliar)

#### `products` (REFATORAR)

```sql
-- Campos a ADICIONAR:
ALTER TABLE public.products
  ADD COLUMN barcode      TEXT,            -- código de barras EAN/GTIN
  ADD COLUMN supplier_id  UUID REFERENCES suppliers(id),
  ADD COLUMN description  TEXT,
  ADD COLUMN unit         TEXT DEFAULT 'un',  -- un, kg, m, l, cx, pç
  ADD COLUMN is_active    BOOLEAN DEFAULT TRUE;

-- Manter: name, sku, cost_price, sale_price, min_stock, current_stock,
--         category, external_ref, tenant_id, timestamps, soft delete
```

#### `product_variants` (NOVO — Fase 5)

```sql
CREATE TABLE public.product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  name        TEXT NOT NULL,           -- "Preto P", "Branco M"
  sku         TEXT,
  barcode     TEXT,
  attributes  JSONB NOT NULL DEFAULT '{}', -- {"color":"Preto","size":"P"}
  cost_price  NUMERIC(10,2) DEFAULT 0,
  sale_price  NUMERIC(10,2) DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `price_lists` (NOVO — Fase 5)

```sql
CREATE TABLE public.price_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,           -- "Atacado", "Varejo", "Funcionários"
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE public.price_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  price         NUMERIC(10,2) NOT NULL,
  UNIQUE (price_list_id, product_id)
);
-- RLS via parent
```

#### `stock_locations` (NOVO — Fase 6, multi-loja)

```sql
CREATE TABLE public.stock_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,           -- "Loja Centro", "Depósito"
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  address     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
-- RLS: tenant_id = current_tenant_id()
```

#### `purchase_orders` (NOVO)

```sql
CREATE TABLE public.purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  code          TEXT NOT NULL,           -- auto: "PC-XXXXXX"
  supplier_id   UUID NOT NULL REFERENCES suppliers(id),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','sent','partial','received','cancelled')),
  subtotal      NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  expected_at   DATE,                    -- previsão de entrega
  received_at   TIMESTAMPTZ,
  nfe_number    TEXT,                    -- número da NF do fornecedor
  nfe_xml       TEXT,                    -- XML importado
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `purchase_items` (NOVO)

```sql
CREATE TABLE public.purchase_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity          NUMERIC(10,3) NOT NULL,
  unit_cost         NUMERIC(10,2) NOT NULL,
  total_cost        NUMERIC(10,2) NOT NULL,
  quantity_received NUMERIC(10,3) DEFAULT 0
);
CREATE INDEX idx_purchase_items_po ON purchase_items(purchase_order_id);
-- RLS via parent
```

---

### 4.9 FINANCEIRO

#### `chart_of_accounts` (NOVO)

```sql
CREATE TABLE public.chart_of_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  code        TEXT NOT NULL,             -- "1.1", "1.1.1", "3.1"
  name        TEXT NOT NULL,             -- "Receita de Vendas"
  type        TEXT NOT NULL CHECK (type IN ('revenue','cost','expense','asset','liability')),
  parent_id   UUID REFERENCES chart_of_accounts(id),
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,  -- não deletável
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_chart_accounts_tenant ON chart_of_accounts(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

**Plano de contas padrão (criado no onboarding):**

```
1       RECEITAS
1.1       Receita de Vendas de Produtos
1.2       Receita de Vendas de Serviços
1.3       Receita de Contratos/Mensalidades
1.4       Outras Receitas

2       CUSTOS
2.1       Custo de Mercadorias Vendidas (CMV)
2.2       Custo de Serviços Prestados

3       DESPESAS OPERACIONAIS
3.1       Aluguel
3.2       Energia Elétrica
3.3       Água
3.4       Telefone/Internet
3.5       Salários e Encargos
3.6       Material de Escritório
3.7       Marketing e Publicidade
3.8       Manutenção e Reparos
3.9       Impostos e Taxas
3.10      Taxas de Cartão/Gateway
3.11      Frete e Transporte
3.12      Outras Despesas

4       DESPESAS FINANCEIRAS
4.1       Juros Pagos
4.2       Tarifas Bancárias
4.3       Multas
```

#### `cost_centers` (NOVO)

```sql
CREATE TABLE public.cost_centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,          -- "Loja Centro", "Equipe Externa", "Administrativo"
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_cost_centers_tenant ON cost_centers(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `financial_entries` (NOVO)

```sql
CREATE TABLE public.financial_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  type             TEXT NOT NULL CHECK (type IN ('receivable','payable')),
  account_id       UUID REFERENCES chart_of_accounts(id),
  cost_center_id   UUID REFERENCES cost_centers(id),
  description      TEXT NOT NULL,
  total_amount     NUMERIC(10,2) NOT NULL,
  paid_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','partial','paid','overdue','cancelled')),
  due_date         DATE NOT NULL,
  paid_at          TIMESTAMPTZ,
  -- Origem (apenas um preenchido):
  sale_id          UUID REFERENCES sales(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  contract_id      UUID REFERENCES contracts(id),
  -- Recorrência:
  is_recurring     BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule  TEXT,                 -- 'monthly', 'weekly', etc.
  parent_entry_id  UUID REFERENCES financial_entries(id),  -- entry recorrente original
  -- Dados do pagador/recebedor:
  entity_type      TEXT CHECK (entity_type IN ('client','supplier','other')),
  entity_id        UUID,
  entity_name      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_fin_entries_tenant  ON financial_entries(tenant_id);
CREATE INDEX idx_fin_entries_type    ON financial_entries(tenant_id, type);
CREATE INDEX idx_fin_entries_status  ON financial_entries(tenant_id, status);
CREATE INDEX idx_fin_entries_due     ON financial_entries(tenant_id, due_date);
-- RLS: tenant_id = current_tenant_id()
```

#### `installments` (NOVO)

```sql
CREATE TABLE public.installments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  financial_entry_id UUID NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,        -- 1, 2, 3...
  amount             NUMERIC(10,2) NOT NULL,
  due_date           DATE NOT NULL,
  paid_amount        NUMERIC(10,2) DEFAULT 0,
  paid_at            TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','paid','overdue','cancelled')),
  payment_method     TEXT CHECK (payment_method IN ('cash','credit','debit','pix','boleto','transfer')),
  gateway_charge_id  TEXT,                    -- ID externo (Stripe/AbacatePay)
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_installments_entry ON installments(financial_entry_id);
CREATE INDEX idx_installments_due   ON installments(tenant_id, due_date, status);
-- RLS: tenant_id = current_tenant_id()
```

#### `cash_registers` (NOVO)

```sql
CREATE TABLE public.cash_registers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL DEFAULT 'Caixa Principal',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cash_registers_tenant ON cash_registers(tenant_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `cash_sessions` (NOVO)

```sql
CREATE TABLE public.cash_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  opened_by        UUID NOT NULL,           -- user_id
  closed_by        UUID,                    -- user_id
  opening_amount   NUMERIC(10,2) NOT NULL,  -- valor inicial (troco)
  closing_amount   NUMERIC(10,2),           -- valor final informado
  expected_amount  NUMERIC(10,2),           -- valor calculado pelo sistema
  difference       NUMERIC(10,2),           -- closing - expected (sobra/falta)
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','closed')),
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at        TIMESTAMPTZ,
  notes            TEXT
);
CREATE INDEX idx_cash_sessions_tenant ON cash_sessions(tenant_id);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(cash_register_id);
-- RLS: tenant_id = current_tenant_id()
```

#### `cash_movements` (NOVO)

```sql
CREATE TABLE public.cash_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id),
  type            TEXT NOT NULL CHECK (type IN ('sale','receipt','withdrawal','expense','adjustment')),
  amount          NUMERIC(10,2) NOT NULL,
  description     TEXT NOT NULL,
  -- Referência opcional:
  sale_id         UUID REFERENCES sales(id),
  payment_id      UUID REFERENCES payments(id),
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cash_movements_session ON cash_movements(cash_session_id);
-- RLS: tenant_id = current_tenant_id()
```

---

## 5. API Endpoints

### 5.1 Convenções

- Prefixo global: `/api`
- Auth: Bearer token (Supabase JWT) em todas as rotas exceto `/api/health` e `/api/auth/*`
- Tenant: injetado via middleware (não precisa enviar)
- Paginação: `?page=1&limit=20` → resposta: `{ data: T[], meta: { total, page, limit, pages } }`
- Filtros: query params (ex: `?status=open&from=2026-01-01`)
- Ordenação: `?sort=createdAt&order=desc`
- Resposta de erro: `{ statusCode, message, error }`

### 5.2 Auth & Onboarding

```
POST   /api/auth/signup              → Cria usuário + tenant + setup inicial
POST   /api/auth/login               → Login (Supabase)
POST   /api/auth/logout              → Logout
POST   /api/auth/forgot-password     → Reset de senha
GET    /api/auth/me                  → Dados do usuário + tenant + role + permissões
```

### 5.3 Super Admin (SUPER_ADMIN only)

```
GET    /api/admin/tenants            → Lista todos os tenants (com filtros)
GET    /api/admin/tenants/:id        → Detalhes do tenant
PATCH  /api/admin/tenants/:id        → Editar plano, status, estender trial
GET    /api/admin/metrics            → Métricas globais (total tenants, MRR, etc.)
GET    /api/admin/plans              → Listar definições de planos
PUT    /api/admin/plans/:id          → Editar plano (módulos, limites)
```

### 5.4 Cadastros

```
# Clientes
GET    /api/clients                  → Lista (paginado, filtro por nome/cpf)
GET    /api/clients/:id              → Detalhe + equipamentos + histórico OS
POST   /api/clients                  → Criar
PATCH  /api/clients/:id              → Editar
DELETE /api/clients/:id              → Soft delete

# Funcionários
GET    /api/employees                → Lista
GET    /api/employees/:id            → Detalhe
POST   /api/employees                → Criar
PATCH  /api/employees/:id            → Editar
DELETE /api/employees/:id            → Soft delete

# Fornecedores
GET    /api/suppliers                → Lista
POST   /api/suppliers                → Criar
PATCH  /api/suppliers/:id            → Editar
DELETE /api/suppliers/:id            → Soft delete

# Serviços (catálogo)
GET    /api/services                 → Lista
POST   /api/services                 → Criar
PATCH  /api/services/:id             → Editar
DELETE /api/services/:id             → Soft delete

# Equipamentos
GET    /api/equipment-types          → Lista tipos
POST   /api/equipment-types          → Criar tipo (com fields_schema)
PATCH  /api/equipment-types/:id      → Editar tipo
DELETE /api/equipment-types/:id      → Soft delete

GET    /api/equipments               → Lista (filtro por client_id, type_id)
GET    /api/equipments/:id           → Detalhe + histórico de OS
POST   /api/equipments               → Criar
PATCH  /api/equipments/:id           → Editar
DELETE /api/equipments/:id           → Soft delete
```

### 5.5 Orçamentos

```
GET    /api/quotes                   → Lista (paginado, filtro por status/client)
GET    /api/quotes/:id               → Detalhe com items
POST   /api/quotes                   → Criar (com items + checklist)
PATCH  /api/quotes/:id               → Editar
DELETE /api/quotes/:id               → Soft delete
POST   /api/quotes/:id/send          → Enviar ao cliente (WhatsApp/email)
POST   /api/quotes/:id/approve       → Aprovar → pode converter em OS
POST   /api/quotes/:id/reject        → Rejeitar (com motivo)
POST   /api/quotes/:id/convert-to-os → Converter orçamento aprovado em OS
GET    /api/quotes/:id/pdf           → Gerar PDF (com logo do tenant)
```

### 5.6 Ordens de Serviço

```
GET    /api/service-orders                 → Lista (paginado, filtros)
GET    /api/service-orders/:id             → Detalhe com items, equipments, time_entries, attachments
POST   /api/service-orders                 → Criar
PATCH  /api/service-orders/:id             → Editar
DELETE /api/service-orders/:id             → Soft delete
PATCH  /api/service-orders/:id/status      → Mudar status (status_id)

# Equipamentos na OS
POST   /api/service-orders/:id/equipments  → Vincular equipamento
DELETE /api/service-orders/:id/equipments/:eqId → Desvincular

# Items na OS
POST   /api/service-orders/:id/items       → Adicionar produto/serviço
PATCH  /api/service-orders/:id/items/:itemId → Editar item
DELETE /api/service-orders/:id/items/:itemId → Remover item

# Registro de horas
POST   /api/service-orders/:id/time-entries → Registrar horas
PATCH  /api/service-orders/:id/time-entries/:teId → Editar
DELETE /api/service-orders/:id/time-entries/:teId → Remover

# Anexos
POST   /api/service-orders/:id/attachments → Upload (multipart)
DELETE /api/service-orders/:id/attachments/:attId → Remover

# PDF
GET    /api/service-orders/:id/pdf         → Gerar PDF (com logo do tenant)
```

### 5.7 Vendas

```
GET    /api/sales                    → Lista (paginado, filtros)
GET    /api/sales/:id                → Detalhe com items + payments
POST   /api/sales                    → Criar (com items + payments)
POST   /api/sales/:id/cancel         → Cancelar
GET    /api/sales/:id/receipt         → Gerar recibo/cupom (PDF)
POST   /api/sales/:id/send           → Enviar por WhatsApp/email

# Trocas e devoluções
GET    /api/returns                  → Lista
POST   /api/returns                  → Criar (com return_items)
PATCH  /api/returns/:id/approve      → Aprovar devolução
PATCH  /api/returns/:id/reject       → Rejeitar devolução

# Relatórios
GET    /api/sales/reports/summary    → Resumo (filtro por período)
GET    /api/sales/reports/by-product → Vendas por produto
GET    /api/sales/reports/by-employee → Vendas por vendedor
GET    /api/sales/reports/by-payment-method → Por forma de pagamento
```

### 5.8 Estoque

```
# Produtos (existente + barcode)
GET    /api/inventory/products             → Lista (paginado, filtros)
GET    /api/inventory/products/:id         → Detalhe
GET    /api/inventory/products/barcode/:code → Busca por código de barras
POST   /api/inventory/products             → Criar
PATCH  /api/inventory/products/:id         → Editar
DELETE /api/inventory/products/:id         → Soft delete

# Movimentações (existente)
GET    /api/inventory/products/:id/entries → Histórico
POST   /api/inventory/entries              → Entrada/saída manual

# Importação NF-e (existente)
POST   /api/inventory/nfe-import           → Upload XML

# Pedidos de compra
GET    /api/purchase-orders                → Lista
GET    /api/purchase-orders/:id            → Detalhe
POST   /api/purchase-orders                → Criar
PATCH  /api/purchase-orders/:id            → Editar
DELETE /api/purchase-orders/:id            → Soft delete
POST   /api/purchase-orders/:id/receive    → Receber (gera stock entry + contas a pagar)

# Relatórios
GET    /api/inventory/reports/stock-level  → Posição de estoque atual
GET    /api/inventory/reports/low-stock    → Produtos abaixo do mínimo
GET    /api/inventory/reports/movements    → Movimentações por período
```

### 5.9 Financeiro

```
# Plano de contas
GET    /api/financial/chart-of-accounts     → Lista (árvore)
POST   /api/financial/chart-of-accounts     → Criar conta
PATCH  /api/financial/chart-of-accounts/:id → Editar
DELETE /api/financial/chart-of-accounts/:id → Desativar

# Centros de custo
GET    /api/financial/cost-centers          → Lista
POST   /api/financial/cost-centers          → Criar
PATCH  /api/financial/cost-centers/:id      → Editar
DELETE /api/financial/cost-centers/:id      → Desativar

# Lançamentos (contas a pagar/receber)
GET    /api/financial/entries               → Lista (filtro: type, status, período, account)
GET    /api/financial/entries/:id           → Detalhe com parcelas
POST   /api/financial/entries               → Criar (com parcelas opcionais)
PATCH  /api/financial/entries/:id           → Editar
DELETE /api/financial/entries/:id           → Soft delete

# Parcelas
PATCH  /api/financial/installments/:id/pay  → Registrar pagamento da parcela
PATCH  /api/financial/installments/:id      → Editar parcela

# Caixa
GET    /api/financial/cash-registers        → Lista caixas
POST   /api/financial/cash-sessions/open    → Abrir caixa (opening_amount)
POST   /api/financial/cash-sessions/close   → Fechar caixa (closing_amount)
GET    /api/financial/cash-sessions/current  → Sessão atual (aberta)
GET    /api/financial/cash-sessions/:id      → Detalhe com movimentações
POST   /api/financial/cash-movements         → Registrar sangria/suprimento

# Relatórios
GET    /api/financial/reports/dre           → DRE por período
GET    /api/financial/reports/cash-flow     → Fluxo de caixa
GET    /api/financial/reports/payable       → Contas a pagar (próximos vencimentos)
GET    /api/financial/reports/receivable    → Contas a receber (próximos vencimentos)
```

### 5.10 Contratos

```
GET    /api/contracts                      → Lista
GET    /api/contracts/:id                  → Detalhe com billing history
POST   /api/contracts                      → Criar
PATCH  /api/contracts/:id                  → Editar
DELETE /api/contracts/:id                  → Soft delete
POST   /api/contracts/:id/activate         → Ativar contrato
POST   /api/contracts/:id/suspend          → Suspender
POST   /api/contracts/:id/cancel           → Cancelar
POST   /api/contracts/:id/bill             → Gerar fatura do período
GET    /api/contracts/:id/pdf              → Gerar PDF do contrato
```

### 5.11 Configurações

```
GET    /api/settings                       → Configurações do tenant
PATCH  /api/settings                       → Atualizar configurações
POST   /api/settings/logo                  → Upload de logo (multipart)

# Status customizáveis
GET    /api/settings/statuses              → Lista (filtro por entity_type)
POST   /api/settings/statuses              → Criar status
PATCH  /api/settings/statuses/:id          → Editar
DELETE /api/settings/statuses/:id          → Soft delete (se não is_system)
PATCH  /api/settings/statuses/reorder      → Reordenar

# Campos customizáveis
GET    /api/settings/custom-fields         → Lista (filtro por entity_type)
POST   /api/settings/custom-fields         → Criar
PATCH  /api/settings/custom-fields/:id     → Editar
DELETE /api/settings/custom-fields/:id     → Soft delete

# Checklist templates
GET    /api/settings/checklist-templates   → Lista
POST   /api/settings/checklist-templates   → Criar
PATCH  /api/settings/checklist-templates/:id → Editar
DELETE /api/settings/checklist-templates/:id → Soft delete

# Permissões
GET    /api/settings/permissions           → Matriz atual
PUT    /api/settings/permissions           → Atualizar matriz inteira
```

### 5.12 Audit & Logs

```
GET    /api/audit-logs                     → Lista (paginado, filtro por user/entity/action/período)
```

### 5.13 Integrações

```
# WhatsApp (Evolution API)
POST   /api/integrations/whatsapp/send     → Enviar mensagem
GET    /api/integrations/whatsapp/status    → Status da instância

# Payment Gateway (Stripe/AbacatePay)
POST   /api/integrations/payment/charge    → Criar cobrança
GET    /api/integrations/payment/charge/:id → Status da cobrança
POST   /api/integrations/payment/webhook   → Webhook do gateway (sem auth)
```

---

## 6. Telas (Frontend Angular)

### 6.1 Rotas Públicas

| Rota | Componente | Descrição |
|---|---|---|
| `/` | LandingComponent | Página institucional |
| `/login` | LoginComponent | Login com email/senha |
| `/cadastro` | SignupComponent | Signup + setup da empresa (nome, logo, segmento) |
| `/cadastro/empresa` | CompanySetupComponent | Step 2: dados da empresa + upload logo |

### 6.2 Rotas Protegidas (`/app`)

| Rota | Componente | Role mínimo |
|---|---|---|
| `/app/dashboard` | DashboardComponent | Todos |
| `/app/clientes` | ClientListComponent | TECNICO+ |
| `/app/clientes/novo` | ClientFormComponent | TECNICO+ |
| `/app/clientes/:id` | ClientDetailComponent | TECNICO+ |
| `/app/clientes/:id/editar` | ClientFormComponent | TECNICO+ |
| `/app/orcamentos` | QuoteListComponent | TECNICO+ |
| `/app/orcamentos/novo` | QuoteFormComponent | TECNICO+ |
| `/app/orcamentos/:id` | QuoteDetailComponent | TECNICO+ |
| `/app/orcamentos/:id/editar` | QuoteFormComponent | TECNICO+ |
| `/app/os` | OsListComponent | TECNICO+ |
| `/app/os/nova` | OsFormComponent | TECNICO+ |
| `/app/os/:id` | OsDetailComponent | TECNICO+ |
| `/app/os/:id/editar` | OsFormComponent | TECNICO+ |
| `/app/equipamentos` | EquipmentListComponent | TECNICO+ |
| `/app/equipamentos/novo` | EquipmentFormComponent | TECNICO+ |
| `/app/vendas` | SalesListComponent | VENDEDOR+ |
| `/app/vendas/pdv` | PdvComponent | VENDEDOR+ |
| `/app/vendas/:id` | SaleDetailComponent | VENDEDOR+ |
| `/app/vendas/devolucoes` | ReturnListComponent | VENDEDOR+ |
| `/app/vendas/devolucoes/nova` | ReturnFormComponent | VENDEDOR+ |
| `/app/estoque` | ProductListComponent | TECNICO+ (read) |
| `/app/estoque/novo` | ProductFormComponent | TENANT_ADMIN |
| `/app/estoque/:id/editar` | ProductFormComponent | TENANT_ADMIN |
| `/app/estoque/nfe-import` | NfeImportComponent | TENANT_ADMIN |
| `/app/compras` | PurchaseOrderListComponent | TENANT_ADMIN |
| `/app/compras/nova` | PurchaseOrderFormComponent | TENANT_ADMIN |
| `/app/compras/:id` | PurchaseOrderDetailComponent | TENANT_ADMIN |
| `/app/financeiro` | FinancialDashComponent | TENANT_ADMIN |
| `/app/financeiro/lancamentos` | FinEntryListComponent | TENANT_ADMIN |
| `/app/financeiro/lancamentos/novo` | FinEntryFormComponent | TENANT_ADMIN |
| `/app/financeiro/caixa` | CashRegisterComponent | VENDEDOR+ |
| `/app/financeiro/dre` | DreComponent | TENANT_ADMIN |
| `/app/financeiro/fluxo-caixa` | CashFlowComponent | TENANT_ADMIN |
| `/app/contratos` | ContractListComponent | TENANT_ADMIN |
| `/app/contratos/novo` | ContractFormComponent | TENANT_ADMIN |
| `/app/contratos/:id` | ContractDetailComponent | TENANT_ADMIN |
| `/app/funcionarios` | EmployeeListComponent | TENANT_ADMIN |
| `/app/funcionarios/novo` | EmployeeFormComponent | TENANT_ADMIN |
| `/app/fornecedores` | SupplierListComponent | TENANT_ADMIN |
| `/app/fornecedores/novo` | SupplierFormComponent | TENANT_ADMIN |
| `/app/servicos` | ServiceCatalogListComponent | TENANT_ADMIN |
| `/app/configuracoes` | SettingsComponent | TENANT_ADMIN |
| `/app/configuracoes/status` | CustomStatusComponent | TENANT_ADMIN |
| `/app/configuracoes/campos` | CustomFieldsComponent | TENANT_ADMIN |
| `/app/configuracoes/checklists` | ChecklistTemplateComponent | TENANT_ADMIN |
| `/app/configuracoes/permissoes` | PermissionsComponent | TENANT_ADMIN |
| `/app/logs` | AuditLogComponent | TENANT_ADMIN |
| `/app/relatorios/vendas` | SalesReportComponent | TENANT_ADMIN |
| `/app/relatorios/estoque` | StockReportComponent | TENANT_ADMIN |

### 6.3 Rotas SUPER_ADMIN (`/admin`)

| Rota | Componente |
|---|---|
| `/admin/dashboard` | AdminDashboardComponent |
| `/admin/tenants` | TenantListComponent |
| `/admin/tenants/:id` | TenantDetailComponent |
| `/admin/planos` | PlanManagementComponent |

---

## 7. Regras de Negócio

### RN01 — Soft Delete
Toda entidade principal usa `deleted_at`. Queries filtram `WHERE deleted_at IS NULL`.

### RN02 — Limite por Plano
Ao criar OS/quote/sale, verificar `count < plan_limits.max_os`. Se exceder → HTTP 402.

### RN03 — Cálculo de Margem
Usar `@nexus-platform/shared-utils`: `calcProfit()`, `calcIdealPrice()`, `calcMarginDelta()`.

### RN04 — Código Auto-gerado
Formato: `{PREFIX}-{timestamp_base36}`. Prefix configurável em `tenant_settings`.

### RN05 — Trial Blocking
Se `subscription.status = 'expired'` e `trial_ends_at < NOW()`, bloquear operações de escrita.
Retornar HTTP 403 com `{ code: 'TRIAL_EXPIRED', upgradeUrl: '/app/upgrade' }`.

### RN06 — Orçamento → OS
Ao aprovar orçamento e converter em OS:
1. Criar `service_order` com dados do orçamento (client_id, items, equipment)
2. Copiar `quote_items` → `so_items`
3. Copiar equipamento vinculado → `so_equipments`
4. Setar `quotes.converted_to_os_id`
5. Status do orçamento → "Aprovado"

### RN07 — Venda → Financeiro
Ao criar venda:
1. Criar `sale` com items + payments
2. Gerar `financial_entry` do tipo `receivable`
3. Se multi-parcela, gerar `installments`
4. Registrar `cash_movement` na sessão do caixa (se PDV)
5. Se status = 'paid', gerar saída de estoque (stock_entries type='out')

### RN08 — Devolução
Ao aprovar devolução:
1. Se `type = 'refund'`: criar `financial_entry` do tipo `payable` (devolução ao cliente)
2. Se `type = 'credit'`: adicionar crédito ao `clients.credit_balance`
3. Se `type = 'exchange'`: calcular diferença, gerar entrada/saída de estoque
4. Sempre: criar `stock_entries` type='in' para itens devolvidos

### RN09 — Contrato → Faturamento
Ao gerar fatura de contrato:
1. Calcular horas usadas no período (sum de `so_time_entries` das OS do contrato)
2. Se `type = 'hourly_franchise'` e `horas_usadas > franchise_hours`:
   - `excess_hours = horas_usadas - franchise_hours`
   - `excess_amount = excess_hours * hour_excess_price`
3. Gerar `financial_entry` do tipo `receivable`
4. Atualizar `contract.next_billing_at`

### RN10 — Controle de Caixa
1. Só pode haver 1 sessão aberta por caixa
2. Toda venda em PDV deve ter sessão de caixa aberta
3. Ao fechar: `expected_amount = opening_amount + sum(movements)`, `difference = closing - expected`
4. Movimentações: `sale` (automático), `receipt` (entrada manual), `withdrawal` (sangria), `expense` (despesa)

### RN11 — Permissões
Toda request passa por `PermissionGuard` que verifica:
1. Role do usuário (via `tenant_users.role`)
2. Permissões do role para o módulo/ação (via `permissions`)
3. Se não tem permissão → HTTP 403

### RN12 — Audit Log
O `AuditInterceptor` registra automaticamente:
- Ações de create, update, delete, status_change
- Dados antes e depois (diff)
- User, IP, timestamp
- **Não** loga reads (GET) para não sobrecarregar

---

## 8. Plano de Implementação por Fases

### FASE 1 — Fundação (refatorar o que existe)

| Task | Spec | Critérios de Aceite |
|---|---|---|
| 1.1 Roles & Permissions | RBAC granular com guard no NestJS | AC: request sem permissão → 403; SUPER_ADMIN não cria OS |
| 1.2 Cadastro de Clientes | CRUD `clients` + busca por nome/CPF | AC: criar cliente com CPF; buscar por nome parcial |
| 1.3 Audit Log | Interceptor funcional + tabela | AC: criar OS → log registrado com user + dados |
| 1.4 Refatorar OS | Adicionar client_id, status_id, employee_id | AC: criar OS vinculando cliente existente; migrar dados antigos |
| 1.5 Refatorar Vendas | Adicionar client_id, status_id, code | AC: venda com cliente vinculado |
| 1.6 Custom Statuses | CRUD de status por entity_type | AC: TENANT_ADMIN cria status; OS usa status customizado |
| 1.7 Tenant Settings | Configurações editáveis | AC: alterar prefixo de OS; alterar validade de orçamento |

### FASE 2 — Core Comercial

| Task | Spec | Critérios de Aceite |
|---|---|---|
| 2.1 Orçamentos | CRUD + items + checklist + envio | AC: criar orçamento → enviar WhatsApp → aprovar → converter em OS |
| 2.2 Equipamentos | Types + instances + vínculo com OS | AC: TENANT_ADMIN cria tipo "Celular" com IMEI; técnico vincula à OS |
| 2.3 Funcionários | CRUD + comissão | AC: criar funcionário; vincular como técnico na OS |
| 2.4 Catálogo de Serviços | CRUD services | AC: criar serviço; usar em orçamento e OS |
| 2.5 Contas a pagar/receber | CRUD financial_entries + parcelas | AC: criar conta parcelada; pagar parcela; status atualiza |
| 2.6 Plano de contas | CRUD hierárquico | AC: plano padrão criado no signup; tenant adiciona conta |
| 2.7 Controle de caixa | Abertura/fechamento + movimentações | AC: abrir caixa → venda registra movimento → fechar → diferença calculada |
| 2.8 PDF Generation | Orçamento + OS + recibo com logo | AC: gerar PDF com logo do tenant; dados corretos |

### FASE 3 — Vendas Avançadas

| Task | Spec | Critérios de Aceite |
|---|---|---|
| 3.1 Trocas/devoluções | Crédito + estorno + troca | AC: devolver produto → estoque volta; troca com diferença de valor |
| 3.2 Código de barras | Busca por barcode no PDV | AC: escanear barcode → produto adicionado ao carrinho |
| 3.3 Relatórios de vendas | Por período, produto, vendedor, forma pgto | AC: relatório mostra totais corretos por filtro |
| 3.4 Desconto por item | Desconto individual + total | AC: aplicar desconto de 10% em item específico |
| 3.5 Envio de venda por WhatsApp/email | Recibo digital | AC: enviar recibo por WhatsApp após venda |
| 3.6 Fornecedores | CRUD suppliers | AC: criar fornecedor com CNPJ |

### FASE 4 — Contratos e Recorrência

| Task | Spec | Critérios de Aceite |
|---|---|---|
| 4.1 Contratos de serviço | CRUD + tipos (fixo/franquia) | AC: criar contrato franquia 10h; vincular OS |
| 4.2 Faturamento de contrato | Gerar fatura + calcular excedente | AC: contrato com 12h usadas e 10h franquia → 2h excedente cobradas |
| 4.3 Faturamento agrupado | Múltiplas OS em 1 fatura | AC: selecionar 3 OS → gerar fatura única |
| 4.4 Onboarding + Subscription | Trial + planos + pagamento | AC: signup → 7 dias trial → expirar → bloquear → pagar → desbloquear |

### FASE 5 — Estoque Avançado

| Task | Spec | Critérios de Aceite |
|---|---|---|
| 5.1 Purchase Orders | Pedidos de compra + recebimento | AC: criar PO → receber → estoque atualiza → conta a pagar gerada |
| 5.2 Grades/variações | Cor, tamanho por produto | AC: produto "Camiseta" com variantes "P/M/G" + "Preto/Branco" |
| 5.3 Tabelas de preço | Múltiplos preços por produto | AC: preço "Atacado" diferente do "Varejo" |
| 5.4 Relatórios de estoque | Posição, movimentações, baixo estoque | AC: relatório mostra 5 produtos abaixo do mínimo |
| 5.5 Importação via planilha | CSV/Excel → clientes ou produtos | AC: upload CSV com 100 clientes → todos importados |

### FASE 6 — Avançado / Futuro

| Task | Spec | Critérios de Aceite |
|---|---|---|
| 6.1 Multi-loja | stock_locations + transferência | AC: transferir 10 unidades da Loja A para Loja B |
| 6.2 Etiquetas (OS + produtos) | Impressão código de barras | AC: gerar etiqueta com barcode; imprimir em impressora térmica |
| 6.3 Fluxo de caixa projeção | Previsão receitas/despesas | AC: gráfico mostra projeção 30/60/90 dias |
| 6.4 Conciliação bancária | Importar extrato + conciliar | AC: importar OFX → sugerir matches |
| 6.5 Área do cliente (portal) | Self-service para clientes | AC: cliente acessa portal → vê OS → paga fatura |
| 6.6 App mobile (técnicos) | PWA ou React Native | AC: técnico recebe OS no app → check-in → fotos → finaliza |
| 6.7 NF-e/NFS-e emissão | Integração SEFAZ | AC: emitir NF-e a partir de venda |
| 6.8 Integração balança | Prix | AC: balança envia peso → produto calculado |

---

## 9. Requisitos Não-Funcionais

| Requisito | Meta | Validação |
|---|---|---|
| **Performance** | API response < 200ms (p95) | Load test com k6 |
| **Segurança** | Zero vazamento cross-tenant | Teste RLS: tenant A nunca vê dados de B |
| **Disponibilidade** | 99.5% uptime | UptimeRobot monitor |
| **Escalabilidade** | Suportar 500 tenants simultâneos | Connection pooling + índices |
| **PWA** | Lighthouse PWA > 90 | Chrome DevTools |
| **SSR** | First Contentful Paint < 1.5s | Lighthouse Performance |
| **Acessibilidade** | WCAG 2.1 AA | Lighthouse Accessibility > 80 |
| **Backup** | Supabase auto-backup diário | Configurar no dashboard |
| **LGPD** | Dados pessoais com consentimento | Soft delete + export de dados |
| **Testes** | Coverage > 80% em services/controllers | Jest + Vitest |

---

## 10. Convenções de Código

### Backend (NestJS)

- **Módulos:** 1 por domínio em `apps/api/src/app/modules/{domain}/`
- **Estrutura por módulo:** `{domain}.module.ts`, `{domain}.controller.ts`, `{domain}.service.ts`, `entities/`, `dto/`
- **DTOs:** class-validator para validação. Sempre `CreateXDto` e `UpdateXDto` (PartialType)
- **Guards:** `AuthGuard` (JWT) + `PermissionGuard` (RBAC) aplicados via `@UseGuards()`
- **Decorators:** `@CurrentTenant()`, `@CurrentUser()`, `@RequirePermission('module:action')`
- **Testes:** `*.spec.ts` ao lado do arquivo. Mockar repositórios com `jest.fn()`.

### Frontend (Angular)

- **Features:** Lazy-loaded em `apps/web/src/app/features/{domain}/`
- **Componentes:** Standalone, sem NgModules. `{name}.component.ts` + `{name}.component.html`
- **Services:** `{domain}.service.ts` com `inject(HttpClient)`
- **State:** BehaviorSubject nos services, Signals nos componentes
- **Forms:** Reactive Forms com FormBuilder
- **Testes:** `*.spec.ts` ao lado. TestBed com mocks de services.
- **Estilo:** TailwindCSS + PrimeNG. Design tokens em `styles.css`.

### Shared

- **Types:** `libs/shared-types/src/lib/{domain}.types.ts` — interfaces, types, enums
- **Utils:** `libs/shared-utils/src/lib/{domain}.utils.ts` — funções puras
- **Imports:** `@nexus-platform/shared-types`, `@nexus-platform/shared-utils`

---

## 11. Referência Rápida para Agentes

### Antes de implementar qualquer feature:

1. **Ler esta spec** — encontrar a seção relevante
2. **Verificar schema do banco** — tabela, campos, índices, RLS
3. **Verificar endpoints** — rota, método, request/response
4. **Verificar regras de negócio** — RN01-RN12
5. **Verificar permissões** — qual role pode fazer o quê
6. **Escrever testes primeiro** (TDD)
7. **Implementar**
8. **Verificar critérios de aceite**

### Arquivos-chave do projeto:

| Arquivo | Propósito |
|---|---|
| `CLAUDE.md` | Esta spec (fonte da verdade) |
| `docs/nexus_tutorial.md` | Tutorial original (referência histórica, pode divergir) |
| `apps/api/src/app/app.module.ts` | Root module NestJS |
| `apps/web/src/app/app.routes.ts` | Rotas Angular |
| `apps/web/src/app/app.config.ts` | Config Angular (providers) |
| `libs/shared-types/src/index.ts` | Tipos compartilhados |
| `libs/shared-utils/src/index.ts` | Utilitários compartilhados |
| `supabase/migrations/` | Schema do banco (versionado) |
