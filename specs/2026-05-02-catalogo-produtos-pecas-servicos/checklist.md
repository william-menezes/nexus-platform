# Checklist: Catálogo de Produtos, Peças e Serviços

Criada em: 2026-05-02  
Referência: `spec.md`

---

## Produto

- [ ] CA01 Spec tem contexto claro (distinção product/equipment explicada) e AC verificáveis
- [ ] CA02 Não-objetivos explícitos: variantes, multi-depósito, NF-e emissão, lotes fora do escopo

## Banco de dados

- [ ] DB01 Migration 022: `product_categories`, `product_brands`, `product_qualities` com RLS e índices
- [ ] DB02 Migration 023: ALTER products com defaults corretos — campo `type` default 'product', campos novos nullable
- [ ] DB03 Migration 024: `service_categories`, `services` com RLS (ou confirmar que migration 009 já cobre)
- [ ] DB04 Trigger de stock `current_stock` não é afetado pelas migrations (trigger está em `stock_entries`)
- [ ] DB05 FK dos lookups é `ON DELETE RESTRICT` — não permite deletar lookup com produtos vinculados

## Segurança / Tenancy

- [ ] SEC01 RLS em `product_categories`, `product_brands`, `product_qualities`, `service_categories`, `services`
- [ ] SEC02 Teste com 2 tenants: tenant A não vê lookups de tenant B (AC05)
- [ ] SEC03 Permissões RBAC: somente TENANT_ADMIN cria/edita/deleta lookups, produtos e serviços

## API

- [ ] API01 `GET /api/inventory/products?type=product` e `?type=part` filtram corretamente
- [ ] API02 `belowMinStock` calculado e retornado na listagem
- [ ] API03 `POST /api/inventory/entries` com type='out' e quantity > stock → 422
- [ ] API04 NF-e import retorna `{ imported, created, matched }` e usa `type='part'` para novos
- [ ] API05 Todos endpoints de lookup em `/api/settings/...` com CRUD completo

## Frontend

- [ ] FE01 Tela de configurações de catálogo acessível em `/app/configuracoes/catalogo`
- [ ] FE02 Formulário de produto/peça com todos os selects de lookup funcionando
- [ ] FE03 Badge de estoque baixo visível na listagem de produtos
- [ ] FE04 Tela de serviços com filtro por categoria e is_active
- [ ] FE05 Serviço inativo não aparece em selects de OS/orçamento/venda

## Qualidade

- [ ] QLT01 Cobertura > 80% nos services: `CatalogSettingsService`, `InventoryService`, `ServicesCatalogService`
- [ ] QLT02 `npx nx affected --target=lint` sem erros
- [ ] QLT03 `npx nx affected --target=test` passando
- [ ] QLT04 Fluxo E2E manual documentado e executado: lookup → produto → entry → verificação

## Backwards compatibility

- [ ] BC01 Produtos existentes sem category/brand/quality continuam funcionando (campos nullable)
- [ ] BC02 Campo `type` padrão 'product' não quebra lógica de listagem existente
- [ ] BC03 `externalRef` (NF-e) ainda funciona para match — campo mantido na entidade
