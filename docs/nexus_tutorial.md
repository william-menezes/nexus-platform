# Nexus Service Platform — Guia Técnico Completo
**PRD + Tutorial de Implementação · Versão 3.1 · Março 2026**

> **Stack:** Angular 20 (SSR) · NestJS · PostgreSQL/Supabase · Nx Monorepo
> **Deploy:** Vercel (frontend) + Render (API via Docker) — 1 repositório GitHub
> **Sprint atual:** Semana 1 — Monorepo + Docker + Tenancy + RLS
> **Supabase:** 100% via dashboard web — sem CLI

---

## Sumário

- [Seção 0 — Como hospedar um monorepo? (Vercel + Render)](#seção-0)
- [Seção 1 — Pré-requisitos](#seção-1)
- [Seção 2 — Criar o Monorepo Nx](#seção-2)
- [Seção 3 — Supabase: Banco de Dados + Auth + RLS](#seção-3)
- [Seção 4 — NestJS Core: Auth, Tenant, Guards](#seção-4)
- [Seção 5 — Dockerfile para o Render](#seção-5)
- [Seção 6 — Vercel: Angular SSR](#seção-6)
- [Seção 7 — Angular Core: Auth, Interceptor, Guards](#seção-7)
- [Seção 8 — Tipos Compartilhados: libs/shared-types](#seção-8)
- [Seção 9 — CI/CD com GitHub Actions](#seção-9)
- [Seção 10 — Critérios de Aceite (Semana 1)](#seção-10)
- [Seção 11 — Módulos: Semanas 2, 3 e 4](#seção-11)
- [Seção 12 — Regras de Negócio Críticas](#seção-12)
- [Seção 13 — Riscos e Mitigações](#seção-13)
- [Seção 14 — Roadmap Técnico](#seção-14)

---

## Seção 0

## Como Hospedar um Monorepo? (Vercel + Render)

> **A dúvida:** "A Vercel precisa de um repo com o código Angular, e o Render precisa de uma imagem Docker do NestJS — como fica com um único repositório?"

**Resposta:** Ambos os serviços leem o **mesmo repositório GitHub**. Cada um ignora o que não é seu.

```
GitHub Repo (main branch)
      │
      ├──► Vercel Webhook ──► build: npx nx build web --prod ──► deploy CDN
      │                       lê: apps/web/
      │
      └──► Render Webhook ──► docker build -f apps/api/Dockerfile . ──► deploy container
                              lê: apps/api/ + libs/ (via Docker context = raiz)
```

### O que cada serviço enxerga

| | GitHub (Monorepo) | Vercel (Frontend) | Render (API / Docker) |
|---|---|---|---|
| **Lê** | tudo | `apps/web/` | `apps/api/Dockerfile` + `libs/` |
| **Ignora** | — | `apps/api/`, `libs/` | `apps/web/` |
| **Build** | — | `nx build web --prod` | `docker build -f apps/api/Dockerfile .` |
| **URL** | — | `nexus.vercel.app` | `nexus-api.onrender.com` |

> ⚠️ **Gotcha crítico do Render:** o campo "Root Directory" no dashboard deve ser `.` (ponto — raiz do monorepo), **não** `apps/api/`. Se você colocar `apps/api/`, o Docker context será aquela pasta e o `COPY libs/` dentro do Dockerfile vai falhar porque `libs/` não existe dentro de `apps/api/`.

### Por que monorepo e não 2 repos separados?

| Monorepo ✅ | 2 repos separados ❌ |
|---|---|
| Tipos TypeScript compartilhados sem `npm publish` | Precisa publicar `shared-types` no npm |
| Um único PR altera frontend + backend atomicamente | PRs precisam ser sincronizados entre repos |
| CI roda lint/test em tudo junto com `nx affected` | CI duplicado e mais caro |
| Refactoring de interfaces é seguro e rastreável | Risco de incompatibilidade de DTO entre API e frontend |

### Configuração correta no Render Dashboard

| Campo | Valor correto |
|---|---|
| Root Directory | `.` ← **ponto, não `apps/api/`** |
| Environment | Docker |
| Dockerfile Path | `apps/api/Dockerfile` |
| Docker Context | `.` ← **ponto, raiz do monorepo** |
| Health Check Path | `/api/health` |

---

## Seção 1

## Pré-requisitos

| Ferramenta | Versão Mínima | Instalação |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org ou `nvm install 20` |
| npm | 10.x | Incluído com Node.js |
| Git | 2.x | https://git-scm.com |
| Docker Desktop | 4.x | https://docker.com/desktop |
| Nx CLI | 19.x | `npm install -g nx` |
| Conta Supabase | — | https://supabase.com (grátis, sem CLI) |

> 💡 A Supabase CLI **não é necessária**. Todo o setup do banco — criar tabelas, configurar RLS, rodar SQL, criar usuários — é feito pelo dashboard em **supabase.com**.

```bash
# Verificar versões antes de começar
node --version     # deve ser v20.x.x
npm --version      # deve ser 10.x.x
git --version
docker --version   # deve ser 24.x ou superior
```

---

## Seção 2

## Criar o Monorepo Nx

### 2.1 Inicializar o Workspace

```bash
# Criar o monorepo
# Quando o wizard perguntar:
#   Package manager: npm
#   Preset: apps (monorepo vazio)
npx create-nx-workspace@latest nexus-platform \
    --preset=apps \
    --pm=npm \
    --nxCloud=skip

cd nexus-platform
```

### 2.2 Instalar plugins Angular e NestJS

```bash
npm install --save-dev @nx/angular @nx/nest

# Verificar instalação
nx list | grep -E "angular|nest"
```

### 2.3 Criar o app Angular 20 com SSR

```bash
nx generate @nx/angular:app web \
    --directory=apps/web \
    --standalone=true \
    --routing=true \
    --ssr=true \
    --style=css \
    --unitTestRunner=jest \
    --e2eTestRunner=none \
    --tags="scope:web"

# Confirmar que buildou
nx build web
```

> 💡 `--standalone=true` usa Standalone Components (padrão Angular 17+). Não são criados NgModules nas features.

### 2.4 Criar o app NestJS

```bash
nx generate @nx/nest:app api \
    --directory=apps/api \
    --tags="scope:api"

# Confirmar
nx build api
nx serve api   # deve responder em localhost:3000
```

### 2.5 Criar bibliotecas compartilhadas

```bash
# DTOs e interfaces compartilhadas entre Angular e NestJS
nx generate @nx/js:lib shared-types \
    --directory=libs/shared-types \
    --tags="scope:shared"

# Utilitários puros (sem dependências externas)
nx generate @nx/js:lib shared-utils \
    --directory=libs/shared-utils \
    --tags="scope:shared"

# Componentes Angular reutilizáveis
nx generate @nx/angular:lib ui-components \
    --directory=libs/ui-components \
    --standalone=true \
    --tags="scope:shared"
```

### 2.6 Instalar dependências

```bash
# Supabase Client
npm install @supabase/supabase-js

# NestJS extras
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-jwt
npm install class-validator class-transformer
npm install --save-dev @types/passport-jwt

# Angular PWA
npm install @angular/pwa --legacy-peer-deps
nx generate @angular/pwa:ng-add --project=web

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### 2.7 Estrutura final do projeto

```
nexus-platform/
├── apps/
│   ├── web/                          # Angular 20 SSR
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/             # Guards, Interceptors, Services globais
│   │   │   │   ├── features/         # Módulos de funcionalidade (lazy)
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── service-orders/
│   │   │   │   │   └── finance/
│   │   │   │   └── app.routes.ts
│   │   │   └── environments/
│   │   └── project.json
│   │
│   └── api/                          # NestJS
│       ├── src/
│       │   ├── core/                 # Auth, Tenant, Guards, Interceptors
│       │   ├── modules/              # Módulos de domínio
│       │   │   ├── tenants/
│       │   │   ├── service-orders/
│       │   │   ├── inventory/
│       │   │   └── finance/
│       │   └── main.ts
│       └── Dockerfile                # ← usado pelo Render
│
├── libs/
│   ├── shared-types/                 # DTOs e interfaces
│   │   └── src/lib/
│   │       ├── tenant.types.ts
│   │       ├── service-order.types.ts
│   │       └── index.ts
│   ├── shared-utils/
│   └── ui-components/
│
├── supabase/
│   └── migrations/                   # SQL versionado — executado manualmente no dashboard
│       ├── 001_init_tenants.sql
│       ├── 002_init_rls.sql
│       └── 003_seed_dev.sql
│
├── .github/workflows/
│   └── ci.yml
├── vercel.json
├── .env.example
├── nx.json
└── package.json
```

> 💡 A pasta `supabase/migrations/` é usada para **versionar os SQLs no Git**, mas eles são executados manualmente no SQL Editor do dashboard — não pela CLI.

---

## Seção 3

## Supabase — Banco de Dados + Auth + RLS

> Toda interação com o Supabase é feita pelo dashboard em **https://supabase.com**. Nenhum comando de terminal é necessário nesta seção.

---

### 3.1 Criar o projeto no Supabase

1. Acesse **https://supabase.com** e faça login (ou crie uma conta gratuita)
2. Clique em **"New project"**
3. Preencha:
   - **Name:** `nexus-platform`
   - **Database Password:** gere uma senha forte e salve em local seguro
   - **Region:** South America (São Paulo) — menor latência para o Brasil
4. Clique em **"Create new project"** e aguarde ~2 minutos

---

### 3.2 Obter as chaves de API

Após o projeto criar:

1. No menu lateral, clique em **Settings → API**
2. Copie os seguintes valores para o seu `.env`:

| Variável no `.env` | Onde encontrar no dashboard |
|---|---|
| `SUPABASE_URL` | "Project URL" (ex: `https://xyzabc.supabase.co`) |
| `SUPABASE_ANON_KEY` | "Project API keys → anon / public" |
| `SUPABASE_SERVICE_KEY` | "Project API keys → service_role / secret" ⚠️ nunca expor no frontend |

3. Ainda em **Settings → Database**, copie:

| Variável no `.env` | Onde encontrar |
|---|---|
| `DATABASE_URL` | "Connection string → URI" (selecionar modo **Transaction** para NestJS) |

> ⚠️ A `service_role` key bypassa todas as políticas RLS. Use **apenas no backend NestJS** via variável de ambiente. Nunca coloque no código Angular.

---

### 3.3 Executar a Migration 1 — Tabelas de Tenancy

1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New query"**
3. Cole o SQL abaixo e clique em **"Run"** (ou `Ctrl+Enter`)

```sql
-- 001_init_tenants.sql
-- Salvar também em: supabase/migrations/001_init_tenants.sql

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Tenants
CREATE TABLE public.tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  plan         TEXT NOT NULL DEFAULT 'starter'
                CHECK (plan IN ('starter', 'pro', 'enterprise')),
  plan_limits  JSONB NOT NULL DEFAULT '{"max_os": 100, "max_users": 3, "max_units": 1}',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ           -- Soft delete (RN01)
);

-- Vínculo usuário ↔ tenant
CREATE TABLE public.tenant_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'operator'
              CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- Índices de performance
CREATE INDEX idx_tenants_slug        ON public.tenants(slug);
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user   ON public.tenant_users(user_id);

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

4. Verifique o resultado: no menu lateral, vá em **Table Editor** — as tabelas `tenants` e `tenant_users` devem aparecer.

> 💡 **Boas práticas de versionamento:** salve cada bloco SQL em `supabase/migrations/` com número sequencial e commite no Git. Isso cria um histórico rastreável de tudo que foi aplicado ao banco, mesmo sem a CLI.

---

### 3.4 Executar a Migration 2 — RLS (Row-Level Security)

1. No **SQL Editor**, clique em **"New query"**
2. Cole o SQL abaixo e clique em **"Run"**

```sql
-- 002_init_rls.sql
-- Salvar também em: supabase/migrations/002_init_rls.sql

-- Função helper: extrai o tenant_id da sessão PostgreSQL atual.
-- O NestJS injeta esse valor via: SELECT set_config('app.tenant_id', $1, true)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Habilitar RLS nas tabelas
ALTER TABLE public.tenants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Políticas: cada tenant vê apenas seus próprios dados
CREATE POLICY "tenants_isolation"
  ON public.tenants FOR ALL
  USING (id = current_tenant_id());

CREATE POLICY "tenant_users_isolation"
  ON public.tenant_users FOR ALL
  USING (tenant_id = current_tenant_id());

-- Forçar RLS mesmo para o role owner do banco
ALTER TABLE public.tenants      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users FORCE ROW LEVEL SECURITY;
```

3. Verifique as políticas: no menu lateral, vá em **Authentication → Policies** — você deve ver as policies `tenants_isolation` e `tenant_users_isolation` listadas.

---

### 3.5 Template SQL para novos módulos

> ⚠️ Toda tabela criada nos módulos das Semanas 2, 3 e 4 **deve seguir este padrão**. Copie, adapte e execute no SQL Editor para cada novo módulo.

```sql
-- Template para novos módulos
CREATE TABLE public.<nome_da_tabela> (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id),
  -- ...campos específicos do módulo...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- soft delete obrigatório (RN01)
);

ALTER TABLE public.<nome_da_tabela> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation"
  ON public.<nome_da_tabela> FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE INDEX idx_<nome_da_tabela>_tenant_id
  ON public.<nome_da_tabela>(tenant_id);

CREATE TRIGGER trg_<nome_da_tabela>_updated_at
  BEFORE UPDATE ON public.<nome_da_tabela>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.6 Criar usuários de teste

Os usuários de autenticação são criados pelo dashboard, pois a tabela `auth.users` é gerenciada internamente pelo Supabase.

**Passo 1 — Criar os usuários:**

1. No menu lateral, vá em **Authentication → Users**
2. Clique em **"Add user → Create new user"**
3. Criar dois usuários:

| E-mail | Senha | Representa |
|---|---|---|
| `tenant_a@teste.com` | `Senha@123` | Operador do Tenant A (TechFix Mobile) |
| `tenant_b@teste.com` | `Senha@123` | Operador do Tenant B (Ar Frio Serviços) |

**Passo 2 — Copiar os UUIDs:**

Após criar cada usuário, na lista de **Authentication → Users**, copie o **UUID** da coluna "UID" de cada um.

**Passo 3 — Inserir seed no SQL Editor:**

No **SQL Editor**, crie uma **"New query"**, substitua os placeholders pelos UUIDs copiados e clique em **"Run"**:

```sql
-- 003_seed_dev.sql
-- Salvar também em: supabase/migrations/003_seed_dev.sql

-- Tenant A: assistência de celular
INSERT INTO public.tenants (id, name, slug, plan)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'TechFix Mobile',
  'techfix',
  'starter'
);

-- Tenant B: climatização
INSERT INTO public.tenants (id, name, slug, plan)
VALUES (
  '22222222-0000-0000-0000-000000000002',
  'Ar Frio Serviços',
  'arfrio',
  'pro'
);

-- Vincular tenant_a@teste.com ao Tenant A
-- SUBSTITUIR pelo UUID copiado do dashboard
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  '<UUID_DO_USUARIO_A>',
  'owner'
);

-- Vincular tenant_b@teste.com ao Tenant B
-- SUBSTITUIR pelo UUID copiado do dashboard
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
  '22222222-0000-0000-0000-000000000002',
  '<UUID_DO_USUARIO_B>',
  'owner'
);
```

---

### 3.7 Verificar tudo no dashboard

Após rodar os três SQLs, confirme em:

| Onde verificar | O que deve aparecer |
|---|---|
| **Table Editor → tenants** | 2 linhas: TechFix Mobile e Ar Frio Serviços |
| **Table Editor → tenant_users** | 2 linhas: um vínculo por usuário |
| **Authentication → Policies** | Policies `tenants_isolation` e `tenant_users_isolation` ativas |
| **Authentication → Users** | 2 usuários de teste listados |

---

### 3.8 Testar isolamento RLS (AC-05)

No **SQL Editor**, crie uma **"New query"** e execute os blocos abaixo **um de cada vez** (não juntos):

```sql
-- TESTE 1: Simular sessão do Tenant A
SET LOCAL app.tenant_id = '11111111-0000-0000-0000-000000000001';
SELECT id, name, slug FROM public.tenants;
-- Resultado esperado: 1 linha (TechFix Mobile)
-- Se retornar 2 linhas: RLS está ERRADO
```

```sql
-- TESTE 2: Simular sessão do Tenant B
SET LOCAL app.tenant_id = '22222222-0000-0000-0000-000000000002';
SELECT id, name, slug FROM public.tenants;
-- Resultado esperado: 1 linha (Ar Frio Serviços)
-- Se aparecer TechFix Mobile aqui: RLS está ERRADO. Não fazer deploy.
```

> ⚠️ Se qualquer teste retornar dados do tenant errado, revise as políticas em **Authentication → Policies** e certifique-se de que a função `current_tenant_id()` foi criada na Migration 2.

---

### 3.9 Como versionar futuras alterações no banco

Sem a CLI, o processo de versionamento é manual mas simples e rastreável:

1. **Escreva o SQL** de alteração localmente no VS Code
2. **Salve o arquivo** em `supabase/migrations/` com número sequencial:
   ```
   supabase/migrations/
   ├── 001_init_tenants.sql      ← aplicado ✅
   ├── 002_init_rls.sql          ← aplicado ✅
   ├── 003_seed_dev.sql          ← aplicado ✅
   ├── 004_add_service_orders.sql  ← Semana 2: criar aqui, rodar no dashboard
   └── 005_add_inventory.sql       ← Semana 3
   ```
3. **Faça commit** no Git — o histórico do arquivo é o registro da migration
4. **Execute no dashboard:** abra o arquivo no VS Code, copie o conteúdo, cole no SQL Editor e clique em "Run"
5. **Nunca edite** um arquivo de migration já commitado — crie um novo para corrigir

---

## Seção 4

## NestJS — Core: Auth, Tenant, Guards

### 4.1 Gerar estrutura de módulos via Nx

```bash
# Core module
nx generate @nx/nest:module core --project=api --no-interactive

# Guards
nx generate @nx/nest:guard core/guards/auth --project=api --no-interactive

# Middleware
nx generate @nx/nest:middleware core/middleware/tenant --project=api --no-interactive

# Interceptors
nx generate @nx/nest:interceptor core/interceptors/audit --project=api --no-interactive

# Módulos de domínio
nx generate @nx/nest:module modules/tenants        --project=api --no-interactive
nx generate @nx/nest:module modules/service-orders --project=api --no-interactive
nx generate @nx/nest:module modules/inventory      --project=api --no-interactive
nx generate @nx/nest:module modules/finance        --project=api --no-interactive
```

### 4.2 Arquivo `.env.example`

As URLs abaixo são as do projeto em **produção** (supabase.com). Não há URLs de localhost do Supabase pois não usamos a CLI local.

```bash
# .env.example — copiar para .env e preencher com valores reais
# Adicionar .env ao .gitignore — NUNCA commitar

# API Config
PORT=3000
NODE_ENV=development

# Supabase (valores em: supabase.com → seu projeto → Settings → API)
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_ANON_KEY=eyJ...          # Project API keys → anon public
SUPABASE_SERVICE_KEY=eyJ...       # Project API keys → service_role ⚠️ apenas no backend

# PostgreSQL direto para TypeORM
# Em: Settings → Database → Connection string → URI → modo: Transaction
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.xyzabc.supabase.co:5432/postgres

# CORS
FRONTEND_URL=http://localhost:4200

# Variáveis públicas do Angular (prefixo NEXT_PUBLIC_ para Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4.3 `apps/api/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}/api`);
}
bootstrap();
```

### 4.4 `apps/api/src/core/guards/auth.guard.ts`

```typescript
import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente ou formato inválido');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request['user'] = user;
    return true;
  }
}
```

### 4.5 `apps/api/src/core/middleware/tenant.middleware.ts`

```typescript
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any)['user'];

    // Rotas públicas (health, auth/login): pular injeção de tenant
    if (!user) return next();

    const rows = await this.dataSource.query<{ tenant_id: string }[]>(
      `SELECT tenant_id FROM public.tenant_users WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    if (!rows.length) {
      throw new ForbiddenException('Usuário não pertence a nenhum tenant');
    }

    const tenantId = rows[0].tenant_id;

    // Injetar na sessão PostgreSQL — current_tenant_id() usa este valor
    await this.dataSource.query(
      `SELECT set_config('app.tenant_id', $1, true)`,
      [tenantId]
    );

    (req as any)['tenantId'] = tenantId;
    next();
  }
}
```

### 4.6 `apps/api/src/core/decorators/tenant.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Uso nas controllers: minhaRota(@CurrentTenant() tenantId: string)
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest()['tenantId'];
  }
);

// Uso nas controllers: minhaRota(@CurrentUser() user: User)
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest()['user'];
  }
);
```

### 4.7 `apps/api/src/app/app.module.ts`

```typescript
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TenantMiddleware } from '../core/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,  // NUNCA true — schema gerenciado pelo Supabase dashboard
      ssl: { rejectUnauthorized: false }, // necessário para conexão Supabase cloud
    }),
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

### 4.8 `apps/api/src/app/app.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    };
  }
}
```

---

## Seção 5

## Dockerfile — NestJS para o Render

> O Dockerfile fica em `apps/api/Dockerfile`. O Docker **context deve ser a raiz do monorepo** (`.`) para que o `COPY libs/` funcione.

### 5.1 `apps/api/Dockerfile`

```dockerfile
# apps/api/Dockerfile
# Executar sempre com contexto na raiz do monorepo:
#   docker build -f apps/api/Dockerfile .
#                                       ↑ ponto = raiz do repo

# ── Estágio 1: Build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json nx.json tsconfig.base.json ./
RUN npm ci

COPY apps/api ./apps/api
COPY libs     ./libs

RUN npx nx build api --prod
# Output em: dist/apps/api/

# ── Estágio 2: Runtime ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', \
    (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main.js"]
```

### 5.2 Testar o Docker localmente

```bash
# Build (contexto = raiz do monorepo)
docker build -f apps/api/Dockerfile -t nexus-api .

# Rodar apontando para o Supabase cloud (usando as variáveis reais do .env)
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:[SENHA]@db.xyzabc.supabase.co:5432/postgres" \
  -e SUPABASE_URL="https://xyzabc.supabase.co" \
  -e SUPABASE_SERVICE_KEY="eyJ..." \
  -e NODE_ENV="production" \
  nexus-api

# Verificar health
curl http://localhost:3000/api/health
# Esperado: {"status":"ok","timestamp":"..."}
```

### 5.3 Configurar no Render Dashboard

1. **New → Web Service** → conectar repositório `nexus-platform`
2. Preencher os campos:

| Campo | Valor |
|---|---|
| Name | `nexus-api` |
| Root Directory | `.` ← **ponto, raiz do monorepo** |
| Environment | `Docker` |
| Dockerfile Path | `apps/api/Dockerfile` |
| Docker Context Dir | `.` ← **ponto, raiz do monorepo** |
| Health Check Path | `/api/health` |

3. Em **Environment Variables**, adicionar:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = URL do Vercel (ex: `https://nexus.vercel.app`)

> 💡 **Keep-alive para o plano Free:** crie um monitor no [UptimeRobot](https://uptimerobot.com) (grátis) fazendo `GET https://nexus-api.onrender.com/api/health` a cada 14 minutos.

---

## Seção 6

## Vercel — Angular 20 com SSR

### 6.1 `vercel.json` (na raiz do monorepo)

```json
{
  "version": 2,
  "buildCommand": "npx nx build web --configuration=production",
  "outputDirectory": "apps/web/dist/web/browser",
  "installCommand": "npm ci",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://nexus-api.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> 💡 O rewrite `/api/*` faz o Vercel agir como proxy para o Render, eliminando problemas de CORS. O Angular chama `/api/...` (relativo) e o Vercel encaminha para o Render.

### 6.2 Configurar no Vercel Dashboard

| Campo | Valor |
|---|---|
| Framework Preset | `Other` (não usar preset Angular — o Nx cuida do build) |
| Root Directory | `.` (o `vercel.json` resolve o resto) |
| Build Command | `npx nx build web --configuration=production` |
| Output Directory | `apps/web/dist/web/browser` |
| Install Command | `npm ci` |
| Node.js Version | `20.x` |

Em **Environment Variables**, adicionar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6.3 Environments Angular

```typescript
// apps/web/src/environments/environment.ts (desenvolvimento)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabaseUrl: 'https://xyzabc.supabase.co',  // URL real do seu projeto
  supabaseAnonKey: 'eyJ...',                    // anon key real
};
```

```typescript
// apps/web/src/environments/environment.production.ts
export const environment = {
  production: true,
  apiUrl: '/api',  // relativo — Vercel faz proxy para o Render
  supabaseUrl: (typeof process !== 'undefined'
    && process.env['NEXT_PUBLIC_SUPABASE_URL']) || '',
  supabaseAnonKey: (typeof process !== 'undefined'
    && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) || '',
};
```

---

## Seção 7

## Angular — Core: Auth, Interceptor, Guards

### 7.1 Gerar estrutura via Nx

```bash
nx generate @nx/angular:service core/auth/auth --project=web --no-interactive
nx generate @nx/angular:interceptor core/interceptors/auth --project=web --no-interactive
nx generate @nx/angular:guard core/guards/auth --project=web --no-interactive
```

### 7.2 `apps/web/src/app/core/auth/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  private _user$ = new BehaviorSubject<User | null>(null);
  private _session$ = new BehaviorSubject<Session | null>(null);

  readonly user$: Observable<User | null> = this._user$.asObservable();
  readonly isLoggedIn$ = this.user$.pipe(map(u => !!u));

  constructor() {
    // Escutar mudanças de auth (login, logout, token refresh automático)
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
    });

    // Restaurar sessão ao recarregar a página
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }

  getAccessToken(): string | null {
    return this._session$.getValue()?.access_token ?? null;
  }
}
```

### 7.3 `apps/web/src/app/core/interceptors/auth.interceptor.ts`

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
```

### 7.4 `apps/web/src/app/core/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map, take } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn$.pipe(
    take(1),
    map(isLoggedIn => {
      if (isLoggedIn) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
```

### 7.5 `apps/web/src/app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

### 7.6 `apps/web/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'app',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'os',
        loadChildren: () =>
          import('./features/service-orders/service-orders.routes').then(m => m.routes)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
```

---

## Seção 8

## Tipos Compartilhados — `libs/shared-types`

```typescript
// libs/shared-types/src/lib/tenant.types.ts

export type TenantPlan = 'starter' | 'pro' | 'enterprise';
export type TenantRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  planLimits: { maxOs: number; maxUsers: number; maxUnits: number; };
  isActive: boolean;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  createdAt: string;
}
```

```typescript
// libs/shared-types/src/lib/service-order.types.ts

export type OsStatus =
  | 'open' | 'in_progress' | 'awaiting_parts' | 'done' | 'cancelled';

export interface ServiceOrder {
  id: string;
  tenantId: string;
  code: string;
  status: OsStatus;
  clientName: string;
  clientPhone?: string;
  description: string;
  customFields: Record<string, unknown>; // JSONB — campos dinâmicos por nicho
  priceIdeal?: number;
  priceEffective?: number;
  deliveredAt?: string;
  warrantyUntil?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

```typescript
// libs/shared-types/src/lib/index.ts
export * from './tenant.types';
export * from './service-order.types';
```

> 💡 O Nx configura o path mapping automaticamente no `tsconfig.base.json`. O alias `@nexus-platform/shared-types` funciona nos dois apps sem configuração extra.

---

## Seção 9

## GitHub Actions — Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # obrigatório para nx affected funcionar

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint (apenas projetos afetados pelo PR)
        run: npx nx affected --target=lint --parallel=3

      - name: Test (apenas projetos afetados)
        run: npx nx affected --target=test --parallel=3 --ci --code-coverage

      - name: Build (apenas projetos afetados)
        run: npx nx affected --target=build --parallel=2

  docker-build:
    runs-on: ubuntu-latest
    needs: ci
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -f apps/api/Dockerfile -t nexus-api:test .

      - name: Testar health check do container
        run: |
          docker run -d -p 3000:3000 \
            -e DATABASE_URL="postgresql://test" \
            -e SUPABASE_URL="http://test" \
            -e SUPABASE_SERVICE_KEY="test" \
            -e NODE_ENV="test" \
            --name nexus-test nexus-api:test
          sleep 5
          curl -f http://localhost:3000/api/health || exit 1
          docker stop nexus-test
```

---

## Seção 10

## Critérios de Aceite — Semana 1

| ID | Critério de Aceite | Como Verificar |
|---|---|---|
| AC-01 | Monorepo Nx com `apps/web`, `apps/api` e `libs/shared-types` | `nx run-many --target=build` sem erros |
| AC-02 | Pipeline CI no GitHub Actions passa em lint + test + build em todo PR | Badge verde no README |
| AC-03 | Projeto Supabase criado em supabase.com com região São Paulo | Dashboard abre; URL visível em Settings → API |
| AC-04 | Migrations 001 e 002 executadas: tabelas com RLS ativas | Table Editor mostra as tabelas; Policies lista 2 policies |
| AC-05 | RLS testado no SQL Editor: Tenant A não vê dados do Tenant B | 2 blocos SQL da seção 3.8 — 0 vazamentos |
| AC-06 | `GET /api/health` retorna HTTP 200 localmente | `curl localhost:3000/api/health` |
| AC-07 | `AuthGuard` rejeita sem token (401); aceita token Supabase válido (200) | Postman: sem header → 401; com token → 200 |
| AC-08 | `TenantMiddleware` injeta `tenant_id` na sessão PostgreSQL | Log do NestJS mostra `SET app.tenant_id = <uuid>` |
| AC-09 | Angular roda com `nx serve web` em `localhost:4200` | Browser sem erros no console |
| AC-10 | SSR: HTML fonte contém conteúdo renderizado sem JS | `Ctrl+U` — conteúdo visível no HTML |
| AC-11 | PWA: Lighthouse PWA Score > 90 | Chrome DevTools → Lighthouse → PWA |
| AC-12 | `docker build -f apps/api/Dockerfile .` completa sem erros | Container responde em `:3000` |
| AC-13 | `.env` não commitado; `.env.example` documentado | `git log` não mostra secrets reais |
| AC-14 | Vercel deploy preview funciona em PR | Vercel bot posta link no PR |

---

## Seção 11

## Módulos — Semanas 2, 3 e 4

### Semana 2 — Módulo de Ordens de Serviço

```bash
nx generate @nx/nest:resource modules/service-orders \
    --project=api --type=rest --crud=true --no-interactive
```

**SQL a executar no Supabase Dashboard (SQL Editor) — salvar como `004_add_service_orders.sql`:**

```sql
CREATE TABLE public.service_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id),
  code            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','awaiting_parts','done','cancelled')),
  client_name     TEXT NOT NULL,
  client_phone    TEXT,
  description     TEXT NOT NULL,
  custom_fields   JSONB NOT NULL DEFAULT '{}',
  price_ideal     NUMERIC(10,2),
  price_effective NUMERIC(10,2),
  delivered_at    TIMESTAMPTZ,
  warranty_until  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.service_orders
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE INDEX idx_service_orders_tenant ON public.service_orders(tenant_id);
CREATE TRIGGER trg_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

> ⚠️ **Decisão técnica pendente:** definir schema JSONB por nicho antes de iniciar.

### Semana 3 — Módulo de Estoque

```bash
nx generate @nx/nest:resource modules/inventory \
    --project=api --type=rest --crud=true --no-interactive
```

> ⚠️ **Decisão técnica pendente:** `nfe-parser` (npm) vs implementação manual para SEFAZ compliance.

### Semana 4 — PDV + Módulo Financeiro

```bash
nx generate @nx/nest:resource modules/finance \
    --project=api --type=rest --crud=true --no-interactive
```

> ⚠️ **Decisão técnica pendente:** WhatsApp — Evolution API (self-hosted) ou WppConnect (cloud).

---

## Seção 12

## Regras de Negócio Críticas

### RN01 — Soft Delete Obrigatório

```typescript
import { Entity, DeleteDateColumn } from 'typeorm';

@Entity('service_orders')
export class ServiceOrderEntity {
  // ...
  @DeleteDateColumn()
  deletedAt?: Date;  // TypeORM gerencia com .softDelete(id)
}
```

### RN02 — Bloqueio por Limite de Plano

```typescript
async create(tenantId: string, dto: CreateServiceOrderDto) {
  const [count, tenant] = await Promise.all([
    this.repo.count({ where: { tenantId, deletedAt: IsNull() } }),
    this.tenantsRepo.findOneOrFail({ where: { id: tenantId } }),
  ]);

  const maxOs = (tenant.planLimits as any).max_os ?? 100;

  if (count >= maxOs) {
    throw new HttpException({
      message: `Limite de ${maxOs} OS atingido no plano ${tenant.plan}.`,
      currentPlan: tenant.plan,
      upgradeUrl: '/pricing',
    }, HttpStatus.PAYMENT_REQUIRED);  // 402
  }

  return this.repo.save({ ...dto, tenantId });
}
```

### RN03 — Cálculo de Lucro Real

```typescript
// libs/shared-utils/src/lib/margin.utils.ts

export interface PriceComponents {
  priceEffective: number;
  productCost: number;
  taxRate: number;       // ex: 0.15 = 15%
  cardFeeRate: number;   // ex: 0.03 = 3%
  otherCosts?: number;
}

export function calcProfit(c: PriceComponents): number {
  const taxes   = c.priceEffective * c.taxRate;
  const cardFee = c.priceEffective * c.cardFeeRate;
  return c.priceEffective - c.productCost - taxes - cardFee - (c.otherCosts ?? 0);
}

export function calcIdealPrice(cost: number, targetMarginPct: number): number {
  return cost / (1 - targetMarginPct / 100);
}

export function calcMarginDelta(ideal: number, effective: number): number {
  return ((effective - ideal) / ideal) * 100;
}
```

---

## Seção 13

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Render Free: cold start > 30s | Alto | Certo | UptimeRobot: `GET /api/health` a cada 14min (grátis) |
| Docker context errado: `COPY libs/` falha no Render | Crítico | Provável | Root Directory = `.` e Docker Context = `.` no dashboard Render |
| RLS mal configurada: dados de um tenant vazam para outro | Crítico | Raro | AC-05 obrigatório antes de deploy — testar no SQL Editor |
| JWT expirado no PWA offline → 401 silencioso | Médio | Possível | `onAuthStateChange` com refresh; redirecionar em 401 |
| Supabase Free: 500MB esgota em ~3 meses | Médio | Provável | Monitorar em Settings → Usage; upgrade $25/mês ao atingir 400MB |
| Vercel timeout ao proxiar para Render em cold start | Médio | Possível | Loading state no Angular; UptimeRobot evita o cold start |
| SQL executado na ordem errada no dashboard | Médio | Possível | Sempre executar na ordem numérica: 001 → 002 → 003. Nunca pular. |

---

## Seção 14

## Roadmap Técnico — 4 Semanas

| Sprint | Entregas Principais | Critério de Encerramento | Depende de |
|---|---|---|---|
| **Semana 1** | Monorepo Nx · Supabase RLS (dashboard) · NestJS Core · Docker · Vercel · Angular PWA | AC-01 a AC-14 todos verdes | — |
| **Semana 2** | Módulo OS · CRUD · JSONB · Workflow Status · Garantia · migration 004 no dashboard | OS do zero ao fechamento em < 2 min no fluxo demo | AC-05 (RLS) |
| **Semana 3** | Módulo Estoque · Grades · NF-e XML · Transferência · migration 005 no dashboard | Importar NF-e de teste; rastreabilidade por serial | Semana 2 |
| **Semana 4** | PDV · multi-pagamento · WhatsApp · Financeiro · DRE · Boleto Asaas | Venda completa do balcão até DRE em < 3 min | Semana 3 |

---

*Nexus Service Platform · Guia Técnico v3.1 · Março 2026 · Supabase 100% via dashboard web*
