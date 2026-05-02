# Tarefas — Catálogo de Produtos, Peças e Serviços

Referência: `spec.md` e `plan.md`

---

## Preparação

- [x] TSK001 ~~Confirmar tabela `services` em migration 009~~ — **confirmado**: tabela existe com `name, description, default_price, estimated_hours, is_active`; migration 024 será apenas `ALTER TABLE services ADD COLUMN category_id`
- [ ] TSK002 Verificar se existe FK de `products.category` (string livre) em alguma query existente que precise atenção ao migrar para `category_id`
- [ ] TSK003 Rodar `npx nx affected --target=build` na branch limpa para confirmar baseline verde

---

## Backend — Lookups

- [ ] TSK010 Criar migration `022_item_lookups.sql`: tabelas `item_categories`, `item_brands`, `item_qualities` com `item_type` discriminador, RLS e índices (ver SQL no plan.md)
- [ ] TSK011 Criar entidades TypeORM: `ItemCategoryEntity`, `ItemBrandEntity`, `ItemQualityEntity` — cada uma com campo `itemType`
- [ ] TSK012 Criar DTOs: `CreateItemCategoryDto` (com `@IsIn(['product','part','service'])`), `CreateItemBrandDto`, `CreateItemQualityDto`
- [ ] TSK013 Criar `CatalogSettingsService`: métodos `findAll(tenantId, itemType)`, `create(tenantId, itemType, dto)`, `update`, `softDelete`; validar que não deleta lookup com itens vinculados (→ 409)
- [ ] TSK014 Criar `CatalogSettingsController`: `GET/POST /api/settings/item-categories?itemType=`, `PATCH/DELETE /:id` — idem para `/item-brands` e `/item-qualities`
- [ ] TSK015 Registrar no `SettingsModule` (ou criar `CatalogSettingsModule`)
- [ ] TSK016 Escrever testes unitários para `CatalogSettingsService`: criar "Samsung" para product e para part como entradas independentes; testar que delete com vinculação retorna 409

---

## Backend — Refatoração de Produtos

- [ ] TSK020 Criar migration `023_refactor_products.sql`: `ALTER TABLE products ADD COLUMN type, category_id, brand_id, quality_id, supplier_id, barcode, description, unit, is_active` com defaults e índices
- [ ] TSK021 Atualizar `ProductEntity`: adicionar campos e relações `@ManyToOne` para `ItemCategoryEntity`, `ItemBrandEntity`, `ItemQualityEntity`, `SupplierEntity`
- [ ] TSK022 Atualizar `CreateProductDto` e `UpdateProductDto`: novos campos com validações; `type` com `@IsIn(['product','part'])`, default `'product'`
- [ ] TSK023 Atualizar `InventoryService.findAllProducts()`: aceitar `type?` como filtro; adicionar campo virtual `belowMinStock` (current_stock < min_stock)
- [ ] TSK024 Atualizar `InventoryService.createEntry()`: aceitar `costPrice?`; se fornecido, atualizar `products.cost_price`
- [ ] TSK025 Verificar e corrigir `NfeImportService`: usar `type='part'` ao criar; tentar match por `barcode` além de `externalRef`; retornar `{ imported, created, matched }`
- [ ] TSK026 Adicionar validação de estoque insuficiente em `createEntry` type='out': se `current_stock < quantity`, lançar `UnprocessableEntityException`
- [ ] TSK027 Escrever testes para `InventoryService` cobrindo os novos cenários (belowMinStock, saída sem estoque, NF-e com match/criação)

---

## Backend — Catálogo de Serviços

- [ ] TSK030 Criar migration `024_refactor_services_add_category.sql`: `ALTER TABLE services ADD COLUMN category_id UUID REFERENCES item_categories(id)` + índice
- [ ] TSK031 Criar `ServiceEntity`: mapear tabela existente + relação `@ManyToOne ItemCategoryEntity` (com `itemType='service'`)
- [ ] TSK032 Criar `CreateServiceDto` / `UpdateServiceDto`: incluir `categoryId` (UUID, opcional, `@IsIn` não necessário pois validado no service)
- [ ] TSK033 Criar `ServicesCatalogService`: CRUD com soft delete, filtros `?category_id=` e `?active=true/false`; ao vincular `category_id`, validar que `item_categories.item_type = 'service'`
- [ ] TSK034 Criar `ServicesCatalogController`: `GET/POST /api/services`, `PATCH/DELETE /api/services/:id`
- [ ] TSK035 Categorias de serviço já cobertas pelo `CatalogSettingsController` com `?itemType=service` (TSK014) — sem tarefa extra
- [ ] TSK036 Escrever testes para `ServicesCatalogService`

---

## Shared Types

- [ ] TSK040 Atualizar `libs/shared-types/src/lib/inventory.types.ts`: adicionar campos novos ao `Product`; criar `ItemCategory`, `ItemBrand`, `ItemQuality` com campo `itemType`
- [ ] TSK041 Atualizar `libs/shared-types/src/lib/service-catalog.types.ts`: adicionar `categoryId`, `category: ItemCategory` ao `ServiceCatalog`

---

## Frontend — Lookups em Configurações

- [ ] TSK050 Criar componente `CatalogSettingsComponent` em `/app/configuracoes/catalogo` com `p-tabs` dois níveis: Produtos / Peças / Serviços → dentro de cada um as sub-listas
- [ ] TSK051 Criar `CatalogSettingsService` Angular: métodos `getCategories(itemType)`, `getBrands(itemType)`, `getQualities(itemType)` com query param `itemType`
- [ ] TSK052 Implementar listas de Produto: tabs "Categorias", "Marcas", "Qualidades" — cada uma com `p-datatable` + `p-dialog` para criar/editar
- [ ] TSK053 Implementar listas de Peça: mesmo layout, `itemType='part'` — listas completamente independentes das de produto
- [ ] TSK054 Implementar lista de Serviço: apenas tab "Categorias", `itemType='service'`
- [ ] TSK055 Adicionar item de menu no sidebar e em `/app/configuracoes`

---

## Frontend — Produtos e Peças

- [ ] TSK060 Atualizar `ProductFormComponent`: adicionar `p-select` para category, brand, quality, supplier; toggle `type` (produto/peça); barcode, unit, is_active
- [ ] TSK061 Atualizar `ProductListComponent` (ou criar separado por type): tab "Produtos" / tab "Peças" ou rota query param; badge `belowMinStock`
- [ ] TSK062 Atualizar `InventoryService` (Angular): novos campos no CRUD, filtro por type

---

## Frontend — Catálogo de Serviços

- [ ] TSK070 Criar `ServicesCatalogListComponent`: listagem com filtro por categoria e is_active
- [ ] TSK071 Criar `ServicesCatalogFormComponent`: formulário com todos os campos
- [ ] TSK072 Criar/atualizar `ServicesCatalogService` (Angular): integração com `/api/services`
- [ ] TSK073 Garantir que serviços inativos não aparecem nos selects de OS, orçamento e venda

---

## Frontend — Entrada de Estoque

- [ ] TSK080 Atualizar tela de entrada manual de estoque: adicionar campos `costPrice` e `date`
- [ ] TSK081 Atualizar tela de importação NF-e: exibir tabela de resultado com colunas "Produto", "Ação" (Vinculado/Criado), "Qtd importada"

---

## Testes e qualidade

- [ ] TSK090 Rodar `npx nx affected --target=lint`
- [ ] TSK091 Rodar `npx nx affected --target=test` — cobertura > 80% em services novos
- [ ] TSK092 Teste de isolamento multi-tenant: tenant A não acessa lookups do tenant B (AC05); também testar que lookup `itemType=product` de um tenant não aparece no `itemType=part` do mesmo tenant
- [ ] TSK093 Testar fluxo completo manual: criar lookup → criar produto → entrada manual → verificar stock
- [ ] TSK094 Testar importação NF-e: upload XML de teste → verificar created/matched/stock

---

## Entrega

- [ ] TSK100 Executar migrations 022, 023, 024 no Supabase Dashboard (ambiente de dev)
- [ ] TSK101 Atualizar `CLAUDE.md` seção 4.8 com os novos campos de products e a estrutura dos lookups
- [ ] TSK102 Conferir todos os ACs (AC01–AC20) e marcar spec como `In Progress` → `Done`
