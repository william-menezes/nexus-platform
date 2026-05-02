# Plano — Catálogo de Produtos, Peças e Serviços

Referência: `spec.md`

---

## Abordagem

Expandir a tabela `products` existente com novos campos e FKs (sem recriar), criar as tabelas de lookup isoladas por tenant, criar o módulo `services-catalog` no NestJS e expor o CRUD de lookups via `SettingsModule` ou módulo dedicado `CatalogSettingsModule`.

A escolha de **uma tabela para produto e peça** (com campo `type`) elimina duplicação de lógica de estoque, de triggers, de DTOs e de UI — a diferença é semântica e de exibição.

---

## Arquitetura e decisões

### D1 — Produto e Peça: mesma tabela, campo `type`
Ambos compartilham 100% dos campos. Separar em tabelas distintas exigiria dois triggers de estoque, dois módulos de CRUD e duplicação de lógica no frontend. O campo `type: 'product' | 'part'` é suficiente para filtrar nas listagens e comunicar semântica.

### D2 — Lookups como tabelas com discriminador `item_type` (não strings livres, não 6 tabelas separadas)
Opção A (strings livres): impossibilita padronização e relatórios por categoria.
Opção B (6 tabelas separadas: product_categories, part_categories, service_categories, product_brands, part_brands, etc.): muitas tabelas com estrutura idêntica.
Opção C (3 tabelas com `item_type`): `item_categories`, `item_brands`, `item_qualities`, cada uma com coluna `item_type TEXT NOT NULL CHECK (item_type IN (...))`. Uma única entidade/service/controller com filtro por `itemType`. **Escolhida** por ser DRY e suficientemente expressiva.

A independência entre produto e peça é garantida pela coluna `item_type`: cadastrar "Samsung" como `item_type='product'` não cria entrada para `item_type='part'` — são linhas distintas. A FK em `products` também valida o `item_type` via check na camada de serviço.

### D3 — Serviços: módulo separado, tabela já existe (migration 009)
A tabela `services` foi criada na migration 009 com: `name, description, default_price, estimated_hours, is_active`. Está funcional mas sem `category_id` e sem módulo NestJS. A migration 024 adiciona apenas `ADD COLUMN category_id`. O módulo `ServicesCatalogModule` é criado do zero.

### D4 — Lookups no módulo Settings
Os CRUDs de categorias/marcas/qualidades são acessados em Configurações. Expor via `SettingsModule` (ou sub-módulo `CatalogSettingsModule`) mantém coerência com o restante das configurações do tenant.

### D5 — `current_stock` gerenciado exclusivamente pelo trigger do banco
O trigger da migration 005 já atualiza `current_stock` a cada insert em `stock_entries`. O service nunca deve fazer UPDATE direto em `products.current_stock`. Isso garante consistência mesmo em operações concorrentes.

### D6 — NF-e: `type='part'` como default para produtos criados via importação
Tipicamente, NF-e de entrada vêm de fornecedores de peças/insumos. O usuário pode alterar para `'product'` depois. Reduz atrito no fluxo mais comum.

### D7 — Campo `costPrice` no `CreateStockEntryDto`
Entrada manual pode ter custo diferente do `costPrice` cadastrado no produto (ex: compra spot). O DTO de entry aceita `costPrice` opcional — se fornecido, atualiza `products.cost_price`.

---

## Mudanças por camada

### Banco (Postgres/Supabase/RLS)

**Migration 022 — `item_lookups`**
```sql
-- item_categories: categorias independentes por item_type
-- item_type='product' → para produtos
-- item_type='part'    → para peças (lista completamente separada)
-- item_type='service' → para serviços
CREATE TABLE item_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','part','service')),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, item_type, name)  -- sem duplicata por tipo dentro do tenant
);
CREATE INDEX idx_item_categories_tenant ON item_categories(tenant_id, item_type)
  WHERE deleted_at IS NULL;

-- item_brands: marcas independentes por item_type (product | part)
CREATE TABLE item_brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','part')),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, item_type, name)
);
CREATE INDEX idx_item_brands_tenant ON item_brands(tenant_id, item_type)
  WHERE deleted_at IS NULL;

-- item_qualities: qualidades independentes por item_type (product | part)
CREATE TABLE item_qualities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('product','part')),
  name        TEXT NOT NULL,
  level       INTEGER NOT NULL DEFAULT 99,  -- 1=melhor; ordena o select
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, item_type, name)
);
CREATE INDEX idx_item_qualities_tenant ON item_qualities(tenant_id, item_type)
  WHERE deleted_at IS NULL;

-- RLS nas 3 tabelas: USING (tenant_id = current_tenant_id())
```

**Migration 023 — `refactor_products`**
```sql
ALTER TABLE products
  ADD COLUMN type         TEXT NOT NULL DEFAULT 'product'
                          CHECK (type IN ('product','part')),
  ADD COLUMN category_id  UUID REFERENCES item_categories(id),
  ADD COLUMN brand_id     UUID REFERENCES item_brands(id),
  ADD COLUMN quality_id   UUID REFERENCES item_qualities(id),
  ADD COLUMN supplier_id  UUID REFERENCES suppliers(id),
  ADD COLUMN barcode      TEXT,
  ADD COLUMN description  TEXT,
  ADD COLUMN unit         TEXT NOT NULL DEFAULT 'un',
  ADD COLUMN is_active    BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_products_type     ON products(tenant_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_barcode  ON products(tenant_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(tenant_id, category_id);
```

**Migration 024 — `refactor_services_add_category`**
```sql
-- tabela services já existe (migration 009) — apenas adicionar category_id
ALTER TABLE services
  ADD COLUMN category_id UUID REFERENCES item_categories(id);

CREATE INDEX idx_services_category ON services(tenant_id, category_id);
```

---

### API (NestJS/TypeORM)

**Módulo `InventoryModule` — expansão**
- `ProductEntity`: adicionar novos campos e relações `@ManyToOne` para category, brand, quality, supplier
- `CreateProductDto`: adicionar campos com `class-validator`; `type` com `@IsIn(['product','part'])`
- `InventoryService.findAllProducts()`: aceitar filtro `type?: string`, calcular `belowMinStock`
- `InventoryService.createEntry()`: aceitar `costPrice?` opcional; se fornecido, atualizar produto
- `InventoryController`: adicionar `@Query('type')` no GET products
- `NfeImportService`: ao criar produto, usar `type='part'`; tentar match também por `barcode`; retornar `{ imported, created, matched }`

**Módulo `ServicesCatalogModule` (novo)**
```
apps/api/src/app/modules/services-catalog/
├── services-catalog.module.ts
├── services-catalog.controller.ts   → CRUD /api/services
├── services-catalog.service.ts
├── entities/
│   └── service.entity.ts            → adicionar @ManyToOne ItemCategoryEntity
└── dto/
    ├── create-service.dto.ts         → incluir category_id (UUID, optional)
    └── update-service.dto.ts
```
> Tabela `services` já existe — a entidade mapeia os campos existentes + `category_id` novo.

**Módulo `CatalogSettingsModule` (novo) ou expansão de `SettingsModule`**
- Entidades: `ItemCategoryEntity`, `ItemBrandEntity`, `ItemQualityEntity` — cada uma com campo `itemType`
- Controller:
  - `GET/POST /api/settings/item-categories?itemType=product|part|service`
  - `PATCH/DELETE /api/settings/item-categories/:id`
  - Idem para `/item-brands?itemType=product|part` e `/item-qualities?itemType=product|part`
- Service: `CatalogSettingsService` com método genérico `findAll(tenantId, itemType)`, `create(tenantId, itemType, dto)`, `softDelete(tenantId, id)` — um único service para as 3 entidades
- Validação na camada de serviço: ao vincular `category_id` a um produto com `type='product'`, verificar que `item_categories.item_type = 'product'` (evitar que admin selecione categoria de peça para produto)

---

### Web (Angular/PrimeNG/Tailwind)

**Telas de lookup em Configurações**
- Rota: `/app/configuracoes/catalogo`
- Componente com `p-tabs` em dois níveis:
  - Nível 1: Produtos | Peças | Serviços
  - Nível 2 (dentro de Produtos e Peças): Categorias | Marcas | Qualidades
  - Nível 2 (dentro de Serviços): apenas Categorias
- Cada lista: `p-datatable` + botão "Novo" que abre `p-dialog`
- O `itemType` é passado ao service Angular conforme a tab ativa — listas de produto e peça são completamente separadas na UI

**Tela de produto/peça**
- `/app/estoque/produtos` e `/app/estoque/pecas` ou única `/app/estoque/items?type=product|part`
- Formulário: `p-select` para category, brand, quality, supplier — todos com opção de criar inline (link "Cadastrar nova categoria")
- Badge `p-tag severity="danger"` quando `belowMinStock = true`

**Tela de serviços**
- Rota: `/app/servicos`
- Formulário: name, category_id (`p-select`), description (`p-textarea`), default_price (`p-inputnumber`), estimated_hours, is_active (`p-checkbox`)

**Tela de entrada manual de estoque**
- Formulário expandido: adicionar `costPrice` (opcional), `supplierId` (opcional), `date` (default hoje)

**Tela de importação NF-e**
- Após importação, exibir tabela de resultado: coluna "Ação" = "Vinculado" | "Criado", produto, quantidade importada

---

### Shared (`libs/shared-types`)

```typescript
// Tipos de lookup — discriminados por itemType
export type LookupItemType = 'product' | 'part' | 'service';

export interface ItemCategory {
  id: string; tenantId: string;
  itemType: LookupItemType;
  name: string; description?: string;
  createdAt: string; deletedAt?: string;
}
export interface ItemBrand {
  id: string; tenantId: string;
  itemType: 'product' | 'part';    // sem 'service'
  name: string;
  createdAt: string; deletedAt?: string;
}
export interface ItemQuality {
  id: string; tenantId: string;
  itemType: 'product' | 'part';
  name: string; level: number;
  createdAt: string; deletedAt?: string;
}

// Atualizar Product
export interface Product {
  // ... campos existentes
  type: 'product' | 'part';        // NOVO
  categoryId?: string;              // NOVO FK → item_categories (item_type deve bater com type)
  category?: ItemCategory;          // NOVO relação
  brandId?: string;                 // NOVO FK → item_brands
  brand?: ItemBrand;                // NOVO
  qualityId?: string;               // NOVO FK → item_qualities
  quality?: ItemQuality;            // NOVO
  supplierId?: string;              // NOVO
  barcode?: string;                 // NOVO
  description?: string;             // NOVO
  unit: string;                     // NOVO (default 'un')
  isActive: boolean;                // NOVO
  belowMinStock?: boolean;          // calculado no backend
}

// Atualizar ServiceCatalog
export interface ServiceCatalog {
  id: string; tenantId: string;
  name: string;
  categoryId?: string;              // NOVO FK → item_categories (item_type='service')
  category?: ItemCategory;          // NOVO
  description?: string;
  defaultPrice: number;
  estimatedHours?: number;
  isActive: boolean;
  createdAt: string; updatedAt: string; deletedAt?: string;
}
```

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Migration 023 quebrar dados existentes | Baixa | Todos os novos campos são nullable ou têm default; campo `type` tem default 'product' |
| Trigger de estoque não disparar após ALTER TABLE | Baixa | Trigger é na tabela `stock_entries`, não em `products` — não afetado |
| Tabela `services` já existe (migration 009) | Resolvido | Migration 024 usa apenas ALTER TABLE; não recriar |
| NF-e import — match por barcode falha se barcode não está na NF-e | Média | Fallback para match por externalRef/cProd; criar novo produto se nenhum match |
| Lookup deletado quebra FK de produto existente | Baixa | FK sem CASCADE (apenas RESTRICT); documentar que não deleta lookup com produtos vinculados |

---

## Estratégia de validação por AC

| AC | Como validar |
|---|---|
| AC01–AC04 | Teste de integração: POST lookup → GET → PATCH → DELETE (soft); verificar que `deleted_at` é setado |
| AC05 | Criar 2 tenants em teste; tenant A não consegue GET nos lookups do tenant B |
| AC06–AC07 | POST product com todos os campos; verificar resposta e banco |
| AC08 | GET /api/inventory/products?type=product e ?type=part retornam subsets corretos |
| AC09 | Inserir produto com min_stock=5, current_stock=3 (via stock_entry); listar e verificar flag |
| AC10 | DELETE produto; GET lista → não aparece; GET /stock_entries → preservados |
| AC11–AC12 | POST service; GET com filtros |
| AC13 | Desativar serviço; verificar que não aparece em GET /api/services?active=true |
| AC14–AC15 | POST entry type=in/out; verificar current_stock via GET produto |
| AC16 | POST entry type=out quantity=9999 → 422 |
| AC17–AC20 | Upload XML válido/inválido; verificar created/matched; verificar stock |
