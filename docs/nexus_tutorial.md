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

---

## Seção 15

## Status Final — Semana 1

### 15.1 O que foi implementado

| Arquivo / Recurso | Status | Observações |
|---|---|---|
| Monorepo Nx (`apps/web`, `apps/api`, `libs/`) | ✅ | Nx 22.6, Angular 20 SSR, NestJS |
| `apps/api/src/app/app.module.ts` | ✅ | TypeORM + ConfigModule + TenantMiddleware |
| `apps/api/src/app/core/guards/auth.guard.ts` | ✅ | Valida JWT via `supabase.auth.getUser()` |
| `apps/api/src/app/core/middleware/tenant.middleware.ts` | ✅ | Injeta `app.tenant_id` na sessão PostgreSQL |
| `apps/api/src/app/core/decorators/tenant.decorator.ts` | ✅ | `@CurrentTenant()` e `@CurrentUser()` |
| `apps/api/src/app/core/interceptors/audit.interceptor.ts` | ✅ | Gerado (stub — implementar em Semana 2) |
| `apps/api/src/app/modules/*.module.ts` | ✅ | Módulos vazios: tenants, service-orders, inventory, finance |
| `apps/web/src/app/core/auth/auth.service.ts` | ✅ | BehaviorSubject, signIn, signOut, getAccessToken |
| `apps/web/src/app/core/interceptors/auth-interceptor.ts` | ✅ | Injeta `Authorization: Bearer <token>` |
| `apps/web/src/app/core/guards/auth-guard.ts` | ✅ | Redireciona para `/login` se não autenticado |
| `apps/web/src/app/app.config.ts` | ✅ | `provideHttpClient(withInterceptors([...]))` |
| `apps/web/src/app/app.routes.ts` | ✅ | Rotas lazy-load com `authGuard` |
| `apps/web/src/app/features/*/` | ⚠️ | Stubs — UI real a implementar nas Semanas 2-4 |
| `libs/shared-types` | ✅ | `Tenant`, `TenantUser`, `ServiceOrder`, `OsStatus` |
| `libs/shared-utils` | ⚠️ | Vazio — `margin.utils.ts` a criar (RN03) |
| `supabase/migrations/001_init_tenants.sql` | ✅ | Executar no Supabase Dashboard |
| `supabase/migrations/002_init_rls.sql` | ✅ | Executar no Supabase Dashboard |
| `supabase/migrations/003_seed_dev.sql` | ✅ | Executar no Supabase Dashboard |
| `apps/api/Dockerfile` | ✅ | Build testado localmente; health check OK |
| `vercel.json` | ✅ | `outputDirectory: dist/apps/web/browser` |
| `.github/workflows/ci.yml` | ✅ | 3 jobs: lint-test / build / docker — por branch |
| `.env.example` | ❌ | A criar (AC-13) |
| `libs/shared-utils/src/lib/margin.utils.ts` | ❌ | A criar (RN03) |

### 15.2 Itens pendentes da Semana 1

**`.env.example`** — deve estar na raiz e commitado (AC-13):

```bash
# .env.example — copiar para .env e preencher com valores reais
# .env está no .gitignore e NUNCA deve ser commitado

# API
PORT=3000
NODE_ENV=development

# Supabase (Settings → API no dashboard)
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...   # ⚠️ apenas no backend

# PostgreSQL (Settings → Database → Connection string → Transaction)
DATABASE_URL=postgresql://postgres.SEU-PROJETO:SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres

# CORS
FRONTEND_URL=http://localhost:4200

# Angular (prefixo público para Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**`libs/shared-utils/src/lib/margin.utils.ts`** — utilitário de cálculo de margem (RN03):

```typescript
export interface PriceComponents {
  priceEffective: number;
  productCost: number;
  taxRate: number;      // ex: 0.15 = 15%
  cardFeeRate: number;  // ex: 0.03 = 3%
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

Exportar em `libs/shared-utils/src/index.ts`:

```typescript
export * from './lib/margin.utils';
```

### 15.3 Critérios de Aceite da Semana 1 — Checklist Final

| ID | Critério | Status |
|---|---|---|
| AC-01 | `nx run-many --target=build` sem erros | ✅ |
| AC-02 | Pipeline CI no GitHub Actions | ✅ |
| AC-03 | Projeto Supabase criado (São Paulo) | ✅ manual |
| AC-04 | Migrations 001 e 002 executadas | ✅ manual |
| AC-05 | RLS testado no SQL Editor | ✅ manual |
| AC-06 | `GET /api/health` retorna 200 | ✅ testado via Docker |
| AC-07 | `AuthGuard` rejeita sem token (401) | ⚠️ testar via Postman |
| AC-08 | `TenantMiddleware` injeta `tenant_id` | ⚠️ testar via Postman |
| AC-09 | `nx serve web` sem erros no browser | ⚠️ verificar |
| AC-10 | SSR: HTML com conteúdo sem JS | ⚠️ verificar após UI real |
| AC-11 | Lighthouse PWA Score > 90 | ⚠️ verificar após UI real |
| AC-12 | Docker build sem erros | ✅ |
| AC-13 | `.env` não commitado; `.env.example` documentado | ❌ criar `.env.example` |
| AC-14 | Vercel deploy preview funciona | ⚠️ corrigir Node 20 + outputDir no dashboard |

---

## Seção 16

## Semana 2 — Módulo de Ordens de Serviço

### 16.1 Decisões técnicas resolvidas

**JSONB `custom_fields` por nicho:**

O campo `custom_fields` da tabela `service_orders` segue um schema diferente por tipo de negócio. O frontend envia o objeto, o backend salva sem validação de estrutura — flexibilidade total.

| Nicho | Campos típicos no JSONB |
|---|---|
| Eletrônicos / celulares | `{ "device": "iPhone 13", "imei": "...", "accessories": ["cabo"], "unlock_code": "1234" }` |
| Climatização (AC) | `{ "equipment": "Split 12000 BTU", "brand": "Springer", "defect": "não gela", "gas_type": "R410A" }` |
| Informática | `{ "device": "Notebook Dell", "serial": "...", "defect": "não liga", "password": "1234" }` |
| Genérico | `{}` — campos livres sem schema fixo |

> 💡 O tenant pode configurar seu schema via settings (Semana 4). Por ora, o frontend envia o que quiser e o backend persiste.

### 16.2 Gerar estrutura NestJS

```bash
# Na raiz do monorepo
nx generate @nx/nest:resource modules/service-orders \
    --project=api --type=rest --crud=true --no-interactive
```

Isso cria em `apps/api/src/app/modules/service-orders/`:
- `service-orders.controller.ts`
- `service-orders.service.ts`
- `service-orders.module.ts`
- `dto/create-service-order.dto.ts`
- `dto/update-service-order.dto.ts`
- `entities/service-order.entity.ts`

### 16.3 Migration SQL — executar no Supabase Dashboard

Salvar como `supabase/migrations/004_add_service_orders.sql` e executar no SQL Editor:

```sql
-- 004_add_service_orders.sql
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

CREATE INDEX idx_service_orders_tenant    ON public.service_orders(tenant_id);
CREATE INDEX idx_service_orders_status    ON public.service_orders(tenant_id, status);
CREATE INDEX idx_service_orders_deleted   ON public.service_orders(tenant_id, deleted_at);

CREATE TRIGGER trg_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 16.4 TypeORM Entity — `service-order.entity.ts`

```typescript
// apps/api/src/app/modules/service-orders/entities/service-order.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from 'typeorm';

@Entity('service_orders')
export class ServiceOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  code: string;

  @Column({ default: 'open' })
  status: 'open' | 'in_progress' | 'awaiting_parts' | 'done' | 'cancelled';

  @Column()
  clientName: string;

  @Column({ nullable: true })
  clientPhone?: string;

  @Column('text')
  description: string;

  @Column('jsonb', { default: {} })
  customFields: Record<string, unknown>;

  @Column('numeric', { nullable: true, precision: 10, scale: 2 })
  priceIdeal?: number;

  @Column('numeric', { nullable: true, precision: 10, scale: 2 })
  priceEffective?: number;

  @Column('timestamptz', { nullable: true })
  deliveredAt?: Date;

  @Column('timestamptz', { nullable: true })
  warrantyUntil?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;  // RN01 — soft delete
}
```

### 16.5 DTOs com validação

```typescript
// dto/create-service-order.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber, Min } from 'class-validator';

export class CreateServiceOrderDto {
  @IsString() @IsNotEmpty()
  clientName: string;

  @IsString() @IsOptional()
  clientPhone?: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsObject() @IsOptional()
  customFields?: Record<string, unknown>;

  @IsNumber() @Min(0) @IsOptional()
  priceIdeal?: number;
}
```

```typescript
// dto/update-service-order.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { CreateServiceOrderDto } from './create-service-order.dto';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @IsString()
  @IsIn(['open', 'in_progress', 'awaiting_parts', 'done', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsString() @IsOptional()
  warrantyUntil?: string;  // ISO 8601

  @IsString() @IsOptional()
  deliveredAt?: string;    // ISO 8601
}
```

### 16.6 Service com RN01 (soft delete) e RN02 (limite de plano)

```typescript
// service-orders.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceOrderEntity } from './entities/service-order.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrderEntity)
    private readonly repo: Repository<ServiceOrderEntity>,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.repo.findOneOrFail({ where: { tenantId, id, deletedAt: IsNull() } });
  }

  async create(tenantId: string, dto: CreateServiceOrderDto) {
    // RN02 — verificar limite de plano
    const count = await this.repo.count({ where: { tenantId, deletedAt: IsNull() } });
    // limite hard-coded por enquanto; virá do tenant.plan_limits no futuro
    if (count >= 100) {
      throw new HttpException(
        { message: 'Limite de 100 OS atingido no plano starter.', upgradeUrl: '/pricing' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const code = `OS-${Date.now().toString(36).toUpperCase()}`;
    return this.repo.save({ ...dto, tenantId, code });
  }

  async update(tenantId: string, id: string, dto: UpdateServiceOrderDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as any);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });  // RN01
  }
}
```

### 16.7 Controller

```typescript
// service-orders.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly service: ServiceOrdersService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceOrderDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateServiceOrderDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
```

### 16.8 Registrar no módulo e no AppModule

```typescript
// service-orders.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrderEntity } from './entities/service-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrderEntity])],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
```

Adicionar ao `app.module.ts`:

```typescript
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({ ... }),
    ServiceOrdersModule,  // ← adicionar
  ],
  ...
})
```

### 16.9 Angular — Feature de Ordens de Serviço

Estrutura de arquivos a criar em `apps/web/src/app/features/service-orders/`:

```
service-orders/
├── service-orders.routes.ts       ← já existe (stub) — atualizar
├── service-orders.service.ts      ← serviço HTTP
├── components/
│   ├── os-list/
│   │   ├── os-list.component.ts
│   │   └── os-list.component.html
│   ├── os-form/
│   │   ├── os-form.component.ts
│   │   └── os-form.component.html
│   └── os-detail/
│       ├── os-detail.component.ts
│       └── os-detail.component.html
```

**`service-orders.service.ts`** (Angular):

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServiceOrder } from '@nexus-platform/shared-types';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/service-orders`;

  getAll()               { return this.http.get<ServiceOrder[]>(this.base); }
  getOne(id: string)     { return this.http.get<ServiceOrder>(`${this.base}/${id}`); }
  create(dto: Partial<ServiceOrder>) { return this.http.post<ServiceOrder>(this.base, dto); }
  update(id: string, dto: Partial<ServiceOrder>) { return this.http.patch<ServiceOrder>(`${this.base}/${id}`, dto); }
  remove(id: string)     { return this.http.delete(`${this.base}/${id}`); }
}
```

**`service-orders.routes.ts`** (atualizar stub):

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/os-list/os-list.component').then(m => m.OsListComponent)
  },
  {
    path: 'nova',
    loadComponent: () => import('./components/os-form/os-form.component').then(m => m.OsFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/os-detail/os-detail.component').then(m => m.OsDetailComponent)
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./components/os-form/os-form.component').then(m => m.OsFormComponent)
  },
];
```

### 16.10 Critérios de Aceite — Semana 2

| ID | Critério | Como Verificar |
|---|---|---|
| AC-2-01 | `POST /api/service-orders` cria OS com `code` gerado | Postman: body com `clientName` e `description` → 201 |
| AC-2-02 | `GET /api/service-orders` retorna apenas OS do tenant logado | Token do Tenant A não deve retornar OS do Tenant B |
| AC-2-03 | `PATCH /api/service-orders/:id` atualiza status | Status `open` → `in_progress` → `done` |
| AC-2-04 | `DELETE /api/service-orders/:id` faz soft delete | `deleted_at` preenchido; OS some do `GET` |
| AC-2-05 | Limite de plano retorna 402 ao exceder 100 OS | Criar 101ª OS → `402 Payment Required` |
| AC-2-06 | Angular lista OS em `/app/os` | Tabela com OS do tenant logado |
| AC-2-07 | Formulário de nova OS funciona | Preencher e salvar → OS aparece na lista |

---

## Seção 17

## Semana 3 — Módulo de Estoque

### 17.1 Decisão técnica: NF-e

**Opção escolhida: `nfe-parser` (npm) — somente leitura/importação**

| | `nfe-parser` ✅ | Implementação manual ❌ |
|---|---|---|
| Complexidade | Baixa — 1 dependência | Alta — SEFAZ XML, assinatura digital |
| Escopo | Importar XML de NF de fornecedor | Emitir NF (requer certificado A1/A3) |
| Adequado para | Entrada de estoque via XML | Faturamento completo (Semana 4+) |

> ⚠️ **Emissão de NF-e está fora do escopo da Semana 3.** A emissão requer certificado digital e integração com SEFAZ estadual — tratar como módulo separado em sprint futuro.

```bash
npm install nfe-parser
```

### 17.2 Migration SQL — executar no Supabase Dashboard

Salvar como `supabase/migrations/005_add_inventory.sql`:

```sql
-- 005_add_inventory.sql
CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id),
  name        TEXT NOT NULL,
  sku         TEXT,
  description TEXT,
  unit        TEXT NOT NULL DEFAULT 'un',
  cost_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE public.stock_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id),
  product_id   UUID NOT NULL REFERENCES public.products(id),
  type         TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity     INTEGER NOT NULL,
  unit_cost    NUMERIC(10,2),
  reference    TEXT,     -- número da NF, código da OS, etc.
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View: saldo atual por produto
CREATE VIEW public.stock_balance AS
  SELECT
    product_id,
    tenant_id,
    SUM(CASE WHEN type = 'in' THEN quantity
             WHEN type = 'out' THEN -quantity
             ELSE quantity END) AS balance
  FROM public.stock_entries
  GROUP BY product_id, tenant_id;

-- RLS
ALTER TABLE public.products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.products
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation" ON public.stock_entries
  FOR ALL USING (tenant_id = current_tenant_id());

-- Índices
CREATE INDEX idx_products_tenant        ON public.products(tenant_id);
CREATE INDEX idx_stock_entries_tenant   ON public.stock_entries(tenant_id);
CREATE INDEX idx_stock_entries_product  ON public.stock_entries(product_id);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 17.3 Gerar estrutura NestJS

```bash
nx generate @nx/nest:resource modules/inventory \
    --project=api --type=rest --crud=true --no-interactive
```

### 17.4 Entidades TypeORM

```typescript
// entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() name: string;
  @Column({ nullable: true }) sku?: string;
  @Column({ nullable: true }) description?: string;
  @Column({ default: 'un' }) unit: string;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) costPrice: number;
  @Column('numeric', { precision: 10, scale: 2, default: 0 }) salePrice: number;
  @Column('int', { default: 0 }) minStock: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
```

```typescript
// entities/stock-entry.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('stock_entries')
export class StockEntryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') productId: string;
  @Column() type: 'in' | 'out' | 'adjustment';
  @Column('int') quantity: number;
  @Column('numeric', { nullable: true, precision: 10, scale: 2 }) unitCost?: number;
  @Column({ nullable: true }) reference?: string;
  @Column({ nullable: true }) notes?: string;
  @CreateDateColumn() createdAt: Date;
}
```

### 17.5 Importação de NF-e XML

```typescript
// apps/api/src/app/modules/inventory/nfe-import.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readNFe } from 'nfe-parser';
import { StockEntryEntity } from './entities/stock-entry.entity';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class NfeImportService {
  constructor(
    @InjectRepository(ProductEntity) private products: Repository<ProductEntity>,
    @InjectRepository(StockEntryEntity) private entries: Repository<StockEntryEntity>,
  ) {}

  async importXml(tenantId: string, xmlContent: string) {
    const nfe = readNFe(xmlContent);
    const results: string[] = [];

    for (const item of nfe.NFe.infNFe.det) {
      const prod = item.prod;
      let product = await this.products.findOne({
        where: { tenantId, sku: prod.cProd },
      });

      if (!product) {
        product = await this.products.save({
          tenantId,
          name: prod.xProd,
          sku: prod.cProd,
          unit: prod.uCom,
          costPrice: parseFloat(prod.vUnCom),
        });
      }

      await this.entries.save({
        tenantId,
        productId: product.id,
        type: 'in',
        quantity: Math.floor(parseFloat(prod.qCom)),
        unitCost: parseFloat(prod.vUnCom),
        reference: nfe.NFe.infNFe.ide.nNF,
      });

      results.push(product.name);
    }

    return { imported: results.length, products: results };
  }
}
```

### 17.6 Tipos compartilhados — adicionar a `shared-types`

```typescript
// libs/shared-types/src/lib/inventory.types.ts
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  currentStock?: number; // calculado via view stock_balance
}

export interface StockEntry {
  id: string;
  tenantId: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitCost?: number;
  reference?: string;
  createdAt: string;
}
```

Exportar em `libs/shared-types/src/lib/shared-types.ts`:
```typescript
export * from './tenant.types';
export * from './service-order.types';
export * from './inventory.types';  // ← adicionar
```

### 17.7 Critérios de Aceite — Semana 3

| ID | Critério | Como Verificar |
|---|---|---|
| AC-3-01 | `POST /api/inventory/products` cria produto | Postman: body com `name`, `costPrice`, `salePrice` |
| AC-3-02 | `GET /api/inventory/products` retorna estoque do tenant | Isolamento RLS ativo |
| AC-3-03 | `POST /api/inventory/nfe-import` processa XML | Upload de XML de NF de teste; produtos criados |
| AC-3-04 | Entrada manual de estoque registra `StockEntry` | `POST /api/inventory/entries` com `type: 'in'` |
| AC-3-05 | Angular lista produtos com saldo atual | Coluna "Estoque" calculada via `stock_balance` |
| AC-3-06 | Alerta visual para produto abaixo do `minStock` | Item em vermelho na listagem |

---

## Seção 18

## Semana 4 — PDV, WhatsApp e Financeiro

### 18.1 Decisão técnica: WhatsApp

**Opção escolhida: Evolution API (self-hosted no Railway)**

| | Evolution API ✅ | WppConnect ❌ |
|---|---|---|
| Custo | Grátis (Railway free tier) | Pago após trial |
| Hospedagem | Railway (1 serviço Docker) | Cloud proprietário |
| Funcionalidades | Envio, recebimento, webhooks | Similar |
| Controle | Total (self-hosted) | Limitado |
| Documentação | boa, REST API | boa |

**Deploy da Evolution API no Railway:**
1. Criar novo projeto no [railway.app](https://railway.app)
2. Deploy via Docker: `atendai/evolution-api:latest`
3. Adicionar variável `AUTHENTICATION_API_KEY=sua-chave-secreta`
4. URL gerada: `https://evolution-api-xxx.railway.app`

Adicionar ao `.env`:
```bash
EVOLUTION_API_URL=https://evolution-api-xxx.railway.app
EVOLUTION_API_KEY=sua-chave-secreta
WHATSAPP_INSTANCE=nexus-tenant  # nome da instância
```

### 18.2 Migration SQL — executar no Supabase Dashboard

Salvar como `supabase/migrations/006_add_finance_pdv.sql`:

```sql
-- 006_add_finance_pdv.sql

-- Vendas (PDV)
CREATE TABLE public.sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id),
  service_order_id UUID REFERENCES public.service_orders(id),
  total           NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','paid','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Itens da venda
CREATE TABLE public.sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  total       NUMERIC(10,2) NOT NULL
);

-- Pagamentos (multi-payment)
CREATE TABLE public.payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id    UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  method     TEXT NOT NULL CHECK (method IN ('cash','credit','debit','pix','boleto')),
  amount     NUMERIC(10,2) NOT NULL,
  paid_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference  TEXT  -- ID externo (Asaas, etc.)
);

-- RLS
ALTER TABLE public.sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.sales
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation" ON public.sale_items
  FOR ALL USING (
    sale_id IN (SELECT id FROM public.sales WHERE tenant_id = current_tenant_id())
  );
CREATE POLICY "tenant_isolation" ON public.payments
  FOR ALL USING (
    sale_id IN (SELECT id FROM public.sales WHERE tenant_id = current_tenant_id())
  );

CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sales_status ON public.sales(tenant_id, status);

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 18.3 Integração Asaas (Boleto / PIX)

```bash
npm install axios  # já vem com NestJS, mas garantir
```

Adicionar ao `.env`:
```bash
ASAAS_API_KEY=seu-token-sandbox
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
```

```typescript
// apps/api/src/app/modules/finance/asaas.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AsaasService {
  private readonly client = axios.create({
    baseURL: process.env.ASAAS_BASE_URL,
    headers: { access_token: process.env.ASAAS_API_KEY },
  });

  async createCharge(data: {
    customer: string;  // ID do customer no Asaas
    billingType: 'BOLETO' | 'PIX';
    value: number;
    dueDate: string;   // YYYY-MM-DD
    description: string;
  }) {
    const { data: response } = await this.client.post('/payments', data);
    return response;
  }

  async getCharge(chargeId: string) {
    const { data } = await this.client.get(`/payments/${chargeId}`);
    return data;
  }
}
```

### 18.4 Serviço WhatsApp

```typescript
// apps/api/src/app/modules/finance/whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly client = axios.create({
    baseURL: process.env.EVOLUTION_API_URL,
    headers: { apikey: process.env.EVOLUTION_API_KEY },
  });

  async sendText(phone: string, message: string) {
    try {
      await this.client.post(
        `/message/sendText/${process.env.WHATSAPP_INSTANCE}`,
        { number: `55${phone.replace(/\D/g, '')}@s.whatsapp.net`, text: message },
      );
    } catch (err) {
      this.logger.error(`WhatsApp send failed: ${err.message}`);
      // não lançar — falha no WhatsApp não deve derrubar a operação principal
    }
  }

  async sendOsReady(phone: string, osCode: string, tenantName: string) {
    const msg = `✅ Olá! Seu equipamento está pronto para retirada.\n\n` +
                `*OS:* ${osCode}\n*Empresa:* ${tenantName}\n\n` +
                `Entre em contato para combinar a retirada.`;
    return this.sendText(phone, msg);
  }
}
```

### 18.5 Tipos compartilhados — adicionar a `shared-types`

```typescript
// libs/shared-types/src/lib/finance.types.ts
export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';
export type SaleStatus = 'open' | 'paid' | 'cancelled';

export interface Sale {
  id: string;
  tenantId: string;
  serviceOrderId?: string;
  total: number;
  discount: number;
  status: SaleStatus;
  items: SaleItem[];
  payments: Payment[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  reference?: string;
}
```

Exportar em `libs/shared-types/src/lib/shared-types.ts`:
```typescript
export * from './tenant.types';
export * from './service-order.types';
export * from './inventory.types';
export * from './finance.types';  // ← adicionar
```

### 18.6 DRE (Demonstrativo de Resultado) — Query SQL

A query abaixo é executada pelo NestJS via `DataSource.query()` e retorna o DRE mensal:

```sql
-- Chamada: SELECT * FROM fn_dre($1, $2, $3)
-- Parâmetros: tenant_id, data_inicio, data_fim
SELECT
  DATE_TRUNC('month', s.created_at)           AS mes,
  SUM(s.total - s.discount)                    AS receita_bruta,
  SUM(
    COALESCE((
      SELECT SUM(se.quantity * se.unit_cost)
      FROM sale_items si2
      JOIN stock_entries se ON se.product_id = si2.product_id
      WHERE si2.sale_id = s.id AND se.type = 'out'
    ), 0)
  )                                             AS custo_produtos,
  SUM(s.total - s.discount) - SUM(
    COALESCE((
      SELECT SUM(se.quantity * se.unit_cost)
      FROM sale_items si2
      JOIN stock_entries se ON se.product_id = si2.product_id
      WHERE si2.sale_id = s.id AND se.type = 'out'
    ), 0)
  )                                             AS lucro_bruto
FROM public.sales s
WHERE s.tenant_id = $1
  AND s.status = 'paid'
  AND s.created_at BETWEEN $2 AND $3
  AND s.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY mes;
```

### 18.7 Gerar estrutura NestJS

```bash
nx generate @nx/nest:resource modules/finance \
    --project=api --type=rest --crud=true --no-interactive
```

### 18.8 Angular — Estrutura das features restantes

```
apps/web/src/app/features/
├── auth/
│   └── login.component.ts          ← stub — implementar formulário
├── landing/
│   └── landing.component.ts        ← stub — implementar página inicial
├── dashboard/
│   └── dashboard.component.ts      ← stub — implementar KPIs
├── service-orders/                 ← Semana 2
│   ├── service-orders.routes.ts
│   ├── service-orders.service.ts
│   └── components/
│       ├── os-list/
│       ├── os-form/
│       └── os-detail/
├── inventory/                      ← Semana 3
│   ├── inventory.routes.ts
│   ├── inventory.service.ts
│   └── components/
│       ├── product-list/
│       ├── product-form/
│       └── nfe-import/
└── finance/                        ← Semana 4
    ├── finance.routes.ts
    ├── pdv/
    │   └── pdv.component.ts        ← tela de venda
    └── reports/
        └── dre.component.ts        ← DRE mensal
```

Atualizar `app.routes.ts` para incluir inventory e finance:

```typescript
{
  path: 'app',
  canActivate: [authGuard],
  children: [
    { path: 'dashboard',   loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: 'os',          loadChildren: () => import('./features/service-orders/service-orders.routes').then(m => m.routes) },
    { path: 'estoque',     loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.routes) },
    { path: 'financeiro',  loadChildren: () => import('./features/finance/finance.routes').then(m => m.routes) },
    { path: '',            redirectTo: 'dashboard', pathMatch: 'full' },
  ]
}
```

### 18.9 Critérios de Aceite — Semana 4

| ID | Critério | Como Verificar |
|---|---|---|
| AC-4-01 | PDV fecha venda com multi-pagamento | Venda com 50% crédito + 50% PIX |
| AC-4-02 | WhatsApp envia mensagem ao fechar OS | Mudar status para `done` → mensagem enviada |
| AC-4-03 | Boleto gerado via Asaas | `POST /api/finance/charge` → link do boleto |
| AC-4-04 | DRE mensal retorna receita e lucro bruto | `GET /api/finance/dre?from=2026-01-01&to=2026-03-31` |
| AC-4-05 | Saída de estoque registrada ao fechar venda | `StockEntry` do tipo `out` criada para cada produto |
| AC-4-06 | Angular PDV lista OS e produtos para seleção | Tela `/app/financeiro/pdv` |
| AC-4-07 | DRE renderizado em gráfico no Angular | `Chart.js` ou similar |

---

## Seção 19

## Dependências adicionais — Semanas 2, 3 e 4

```bash
# Semana 2
npm install @nestjs/mapped-types

# Semana 3
npm install nfe-parser

# Semana 4
npm install axios
# Angular charts (DRE)
npm install chart.js ng2-charts
```

---

## Seção 20

## Estratégia de Branches e Banco de Dados

### 20.1 Fluxo de desenvolvimento

```
feature/nova-feature
        │
        ▼ PR + CI (lint + test)
    develop ──────────────────► Supabase DEV
        │                        (nexus-platform-dev)
        ▼ PR + CI (lint + test + build)
    homolog ──────────────────► Supabase DEV
        │                        (mesmo projeto)
        ▼ PR + CI (lint + test + build + docker)
    master  ──────────────────► Supabase PROD
                                 (nexus-platform-prod)
```

### 20.2 Dois projetos Supabase

| Projeto | Usado por | Dados |
|---|---|---|
| `nexus-platform-dev` | `develop`, `homolog`, local | Dados de teste |
| `nexus-platform-prod` | `master` | Dados reais |

### 20.3 Processo de migration por branch

Toda migration deve ser aplicada em dois momentos:

1. **Merge em `homolog`** → executar SQL no `nexus-platform-dev`
2. **Merge em `master`** → executar SQL no `nexus-platform-prod`

Os arquivos em `supabase/migrations/` são o registro versionado. Nunca editar um arquivo já commitado — criar novo arquivo com número sequencial.

### 20.4 CI por branch

| Branch | Job executado | Gatilho |
|---|---|---|
| `feature/*` | lint-test (via PR) | Pull Request → develop |
| `develop` | lint-test | push |
| `homolog` | lint-test + build | push |
| `master` | lint-test + build + docker | push |

---

*Nexus Service Platform · Guia Técnico v4.0 · Março 2026 · Supabase 100% via dashboard web*
