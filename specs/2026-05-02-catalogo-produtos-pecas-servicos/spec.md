# Catálogo de Produtos, Peças e Serviços

Status: Draft  
Owner: @william  
Criada em: 2026-05-02  
Links: —

---

## Contexto

O sistema possui uma entidade `products` genérica criada na migração 005, usada tanto pelo módulo de estoque quanto pela importação de NF-e. Ela carece de atributos essenciais para o dia-a-dia de uma assistência técnica: tipo (produto vs. peça), marca, qualidade e código de barras. Além disso, categoria e fornecedor são apenas strings/ids sem tabela própria, o que impede a gestão padronizada.

A tabela `services` existe desde a migration 009, mas ainda não tem `category_id`, não tem módulo NestJS nem endpoints criados na API.

Há também uma confusão conceitual a ser explicitada:
- **`products`** = itens com controle de estoque (produtos vendidos e peças usadas em OS)
- **`equipments`** = aparelhos de clientes que entram para conserto — **sem estoque**

Esta spec define o modelo correto, as tabelas de lookup com isolamento por tipo de item (categorias, marcas, qualidades para produto e peça são listas independentes), e os dois fluxos de entrada de estoque.

---

## Objetivos

- [ ] Diferenciar **produto** e **peça** dentro da mesma tabela `products` usando campo `type`
- [ ] Criar tabelas de lookup com isolamento por `item_type`: `item_categories` (product/part/service), `item_brands` (product/part), `item_qualities` (product/part) — lookups de produto e peça são listas independentes
- [ ] Enriquecer `products` com marca, qualidade, categoria (FK), fornecedor (FK), barcode, descrição e unidade
- [ ] Criar módulo NestJS, entidade e endpoints para **catálogo de serviços** (tabela `services` já existe — precisa de `category_id` e API)
- [ ] Garantir que os dois fluxos de entrada de estoque funcionem: **via NF-e** e **manual**
- [ ] Expor CRUD completo para todas as tabelas de lookup no painel de configurações

---

## Não-objetivos

- Controle de variantes/grades de produto (Fase 5 do CLAUDE.md)
- Tabelas de preço múltiplas (Fase 5)
- Lotes e rastreabilidade
- Integração com balança (Fase 6)
- Geração ou emissão de NF-e (Fase 6)
- Múltiplos depósitos/localizações de estoque (Fase 6)

---

## Distinção conceitual chave

| Entidade | Tabela | Tem estoque? | Pertence a quem? | Usado em |
|---|---|---|---|---|
| Produto | `products` (type='product') | Sim | Tenant (para venda) | Vendas, OS items, orçamentos |
| Peça | `products` (type='part') | Sim | Tenant (consumo interno) | OS items, orçamentos |
| Serviço | `services` | Não | Tenant (catálogo) | OS items, orçamentos, contratos |
| Equipamento | `equipments` | Não | Cliente | Vinculado a OS para conserto |

---

## Atributos por tipo

### Produto e Peça (tabela `products`)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| name | text | Sim | |
| type | enum | Sim | `product` \| `part` |
| category_id | FK product_categories | Não | |
| brand_id | FK product_brands | Não | |
| quality_id | FK product_qualities | Não | |
| supplier_id | FK suppliers | Não | Já existe migration 015 |
| cost_price | numeric | Sim | Default 0 |
| sale_price | numeric | Sim | Default 0 |
| current_stock | int | — | Gerenciado por trigger |
| min_stock | int | Sim | Default 0 |
| sku | text | Não | |
| barcode | text | Não | EAN/GTIN |
| description | text | Não | |
| unit | text | Não | un, kg, m, l, cx, pç — default 'un' |
| is_active | boolean | Sim | Default true |

### Serviço (tabela `services`)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| name | text | Sim | |
| category_id | FK service_categories | Não | |
| description | text | Não | |
| default_price | numeric | Sim | Default 0 |
| estimated_hours | numeric | Não | Horas estimadas de execução |
| is_active | boolean | Sim | Default true |

### Tabelas de lookup

Três tabelas, cada uma com coluna `item_type` como discriminador. Isso garante que as listas de produto e peça sejam **completamente independentes**: cadastrar "Samsung" como marca de produto não cria automaticamente "Samsung" como marca de peça — são entradas separadas gerenciadas de forma distinta.

| Tabela | `item_type` válidos | Campos adicionais | Usado por |
|---|---|---|---|
| `item_categories` | `'product'`, `'part'`, `'service'` | name, description | `products.category_id`, `services.category_id` |
| `item_brands` | `'product'`, `'part'` | name | `products.brand_id` |
| `item_qualities` | `'product'`, `'part'` | name, level (int) | `products.quality_id` |

> `level` em `item_qualities` define a ordem no select (menor = maior qualidade). Ex: 1=Original, 2=Paralelo Premium, 3=Paralelo, 4=Genérico.

> Uma marca "Samsung" cadastrada para `item_type='product'` é uma linha diferente de "Samsung" para `item_type='part'`. O admin pode ter a marca Samsung apenas para peças, apenas para produtos, para ambos ou para nenhum — sem dependência entre eles.

---

## Usuários e cenários

### Cenário 1 — Cadastrar marcas independentes para produto e peça

**Dado** que sou TENANT_ADMIN em Configurações > Catálogo  
**Quando** acesso a aba "Marcas de Produto" e cadastro "Samsung", depois acesso "Marcas de Peça" e NÃO cadastro "Samsung"  
**Então** ao criar um produto, "Samsung" aparece no select de marca; ao criar uma peça, "Samsung" não aparece — a lista de marcas de peça está vazia

### Cenário 2 — Cadastrar uma peça com lookups de peça

**Dado** que tenho em "Marcas de Peça": "Samsung", "Apple"; em "Categorias de Peça": "Tela"; em "Qualidades de Peça": "Original", "Paralelo"  
**Quando** acesso Estoque > Peças > Nova peça  
**Então** consigo preencher nome, categoria, marca, qualidade, fornecedor, preços, SKU e barcode e salvar

### Cenário 3 — Cadastrar um serviço

**Dado** que tenho a categoria "Reparo de Tela" cadastrada  
**Quando** acesso Catálogo de Serviços > Novo serviço  
**Então** consigo cadastrar nome, categoria, descrição, preço base e horas estimadas

### Cenário 4 — Entrada de estoque manual

**Dado** que tenho um produto/peça cadastrado  
**Quando** acesso Estoque > Movimentações > Nova entrada e seleciono o item, quantidade e custo  
**Então** o sistema registra a movimentação e o `current_stock` é atualizado

### Cenário 5 — Entrada de estoque via NF-e

**Dado** que recebi uma NF-e XML do fornecedor  
**Quando** acesso Estoque > Importar NF-e e faço upload do XML  
**Então** o sistema interpreta os itens da nota, cria ou vincula aos produtos existentes (por SKU/barcode/externalRef), registra entradas de estoque e exibe um resumo do que foi importado

### Cenário 6 — Produto abaixo do estoque mínimo

**Dado** que o produto "Tela iPhone 13" tem `min_stock = 5` e `current_stock = 3`  
**Quando** acesso a listagem de estoque  
**Então** o item aparece destacado como "abaixo do mínimo"

---

## Regras de negócio

- **RNP01** — Produto e Peça coexistem na mesma tabela `products`. O campo `type` discrimina. A diferença é semântica: produto é para venda direta; peça é para consumo em OS.
- **RNP02** — Lookups são por tenant **e** por `item_type`. Um tenant não enxerga lookups de outro (RLS + tenant_id). Dentro do mesmo tenant, os selects de produto mostram apenas lookups com `item_type='product'`; os de peça mostram apenas `item_type='part'`; serviços mostram `item_type='service'`.
- **RNP03** — Lookup deletado (soft delete) não aparece nos selects de formulário, mas permanece vinculado a itens já existentes (FK sem cascade). Não é possível deletar um lookup com itens ativos vinculados (retorna 409).
- **RNP04** — `current_stock` é calculado pelo trigger no banco (migration 005). Nunca atualizar diretamente via UPDATE — sempre via `stock_entries`.
- **RNP05** — Na importação via NF-e, o sistema tenta vincular pelo campo `externalRef` (cProd) ou `barcode`/`sku`. Se não encontrar, cria novo produto com `type = 'part'` por padrão (peça, pois NF-e de fornecedor tipicamente são peças/insumos). O usuário pode alterar o tipo depois.
- **RNP06** — Entrada manual de estoque sem NF-e deve registrar pelo menos: produto, quantidade, tipo ('in'/'out') e observação.
- **RNP07** — Serviço não tem `current_stock` nem `stock_entries`. Serviço nunca aparece em listagens de estoque.
- **RNP08** — `item_qualities.level` define a ordem de exibição no select (nível menor = maior qualidade). Exemplos: 1=Original, 2=Paralelo Premium, 3=Paralelo, 4=Genérico. O campo `level` é por `item_type` — qualidade nível 1 para produto e qualidade nível 1 para peça são entradas independentes.
- **RNP09** — Ao desativar (`is_active = false`) um produto/serviço, ele não aparece em novos orçamentos, OS ou vendas, mas permanece em registros históricos.

---

## Critérios de aceite

### Lookups
- **AC01** — TENANT_ADMIN cria, edita e deleta (soft) categorias via `GET/POST/PATCH/DELETE /api/settings/item-categories?itemType=product|part|service` — cada `itemType` retorna/cria apenas entradas daquele tipo
- **AC02** — TENANT_ADMIN cria, edita e deleta marcas via `/api/settings/item-brands?itemType=product|part` — marcas de produto e de peça são listas separadas
- **AC03** — TENANT_ADMIN cria, edita e deleta qualidades via `/api/settings/item-qualities?itemType=product|part`, ordenadas por `level`
- **AC04** — Criar marca "Samsung" com `itemType=product` e NÃO criar para `itemType=part`: ao abrir formulário de produto, "Samsung" aparece; ao abrir formulário de peça, lista de marcas está vazia
- **AC05** — Lookups de outros tenants nunca aparecem (RLS validado com 2 tenants distintos)
- **AC06** — Tentativa de deletar lookup com itens ativos vinculados retorna 409

### Produtos e Peças
- **AC07** — Criar produto com `type='product'`: name, category_id, brand_id, quality_id, supplier_id, costPrice, salePrice, minStock, sku, barcode — retorna 201 com id
- **AC08** — Criar peça com `type='part'` com os mesmos campos — retorna 201 com id
- **AC09** — `category_id` de um produto só aceita FK de `item_categories` com `item_type='product'`; tentar usar uma categoria de peça retorna 422
- **AC10** — Listar produtos filtrados por `type=product` e `type=part` separadamente via query param
- **AC11** — Produto com `current_stock < min_stock` é retornado com flag `belowMinStock: true` na listagem
- **AC12** — Deletar produto (soft delete): produto some da listagem mas `stock_entries` do produto são preservados

### Serviços
- **AC13** — Criar serviço com name, category_id, description, default_price, estimated_hours — retorna 201 (`category_id` usa `item_categories` com `item_type='service'`)
- **AC14** — Listar serviços com filtro por `category_id` e `is_active`
- **AC15** — Serviço desativado (`is_active=false`) não aparece nos selects de OS/orçamento/venda

### Entrada manual de estoque
- **AC16** — POST `/api/inventory/entries` com `type='in'`, `productId`, `quantity=10`: `current_stock` do produto aumenta em 10
- **AC17** — POST `/api/inventory/entries` com `type='out'`, `quantity=3`: `current_stock` reduz em 3
- **AC18** — Tentativa de saída maior que stock disponível retorna 422 com mensagem clara

### Entrada via NF-e
- **AC19** — Upload de XML NF-e válido: itens da nota são importados, `current_stock` atualizado, resposta retorna `{ imported: N, created: X, matched: Y }`
- **AC20** — Item da NF-e cujo `cProd` coincide com `externalRef` de produto existente: não cria duplicata, apenas registra entry
- **AC21** — Item sem match: cria novo produto com `type='part'` e `externalRef=cProd`
- **AC22** — XML inválido retorna 400 com mensagem descritiva

---

## Impacto técnico

### Projetos Nx afetados
- `api` — novo módulo `services-catalog`, refatoração de `inventory`, novos endpoints de lookup em `settings`
- `web` — telas de cadastro de produto/peça/serviço, telas de lookup em configurações, enhancement da tela de importação NF-e
- `libs/shared-types` — atualizar `Product`, `StockEntry`; criar `ServiceCatalog`, tipos de lookup
- `libs/shared-utils` — nenhum impacto esperado

### API — endpoints novos e modificados

```
# Lookups (Settings)
GET/POST           /api/settings/product-categories
PATCH/DELETE       /api/settings/product-categories/:id
GET/POST           /api/settings/service-categories
PATCH/DELETE       /api/settings/service-categories/:id
GET/POST           /api/settings/product-brands
PATCH/DELETE       /api/settings/product-brands/:id
GET/POST           /api/settings/product-qualities
PATCH/DELETE       /api/settings/product-qualities/:id

# Produtos e Peças (módulo inventory existente — expandir)
GET    /api/inventory/products?type=product|part   ← adicionar filtro type
POST   /api/inventory/products                     ← aceitar novos campos
PATCH  /api/inventory/products/:id

# Entrada manual — sem mudança de rota, apenas DTO expandido
POST   /api/inventory/entries                      ← adicionar costPrice, supplierId, date

# Serviços (módulo novo)
GET    /api/services
POST   /api/services
PATCH  /api/services/:id
DELETE /api/services/:id
```

### Banco — migrações necessárias

```
022_product_lookups.sql      — tabelas product_categories, service_categories,
                                product_brands, product_qualities
023_refactor_products.sql    — ALTER products: ADD type, brand_id, quality_id,
                                category_id, supplier_id, barcode, description,
                                unit, is_active, description
024_services_catalog.sql     — CREATE services (com FK service_category_id)
```

### Permissões RBAC

| Módulo | Ação | TENANT_ADMIN | TECNICO | VENDEDOR |
|---|---|---|---|---|
| products | create, update, delete | ✅ | ❌ | ❌ |
| products | read | ✅ | ✅ | ✅ |
| services_catalog | create, update, delete | ✅ | ❌ | ❌ |
| services_catalog | read | ✅ | ✅ | ✅ |
| inventory | entry, adjust | ✅ | ❌ | ❌ |
| settings/lookups | create, update, delete | ✅ | ❌ | ❌ |

### Observabilidade
- Audit log (RN12): create/update/delete de produtos, peças, serviços e lookups

---

## Plano de testes

- **Unit:** `InventoryService`, `ServicesCatalogService` — mockar repositories; testar RNP04, RNP05, RNP06, RNP07
- **Integração:** NfeImportService contra banco real; validar que trigger atualiza `current_stock`
- **E2E/manual:** Fluxo completo: criar lookup → criar produto vinculado → entrada manual → verificar stock; upload NF-e → verificar match e criação

---

## Rollout

- Feature flag: não necessário
- Backwards compatibility: campo `type` deve ter valor default `'product'` na migration para não quebrar dados existentes; campos novos são `nullable` ou têm default
- Migrações: 022 → 023 → 024 (executar em sequência no Supabase Dashboard)
- Nenhuma tela existente quebra — apenas ganham novos campos opcionais
