# Tarefas — Refatoração do Formulário de Clientes

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Ler e validar spec + plan com o time; confirmar ACs e escopo
- [ ] TSK002 Verificar se `npx nx affected --target=build` passa no estado atual antes de qualquer mudança

## Banco de Dados

- [ ] TSK010 Criar migration `supabase/migrations/YYYYMMDD_add_birth_date_gender_to_clients.sql`
  - Adicionar `birth_date DATE` (nullable) à tabela `clients`
  - Adicionar `gender TEXT CHECK (gender IN ('M','F','other'))` (nullable) à tabela `clients`
- [ ] TSK011 Aplicar e verificar migration em ambiente de dev (Supabase local ou dashboard)

## Shared Libraries

- [ ] TSK020 Atualizar `libs/shared-types/src/lib/client.types.ts`
  - Adicionar `birthDate?: string` e `gender?: 'M' | 'F' | 'other'` à interface `Client`
  - Criar interface `ClientHistoryItem` (id, code, status, createdAt, type: 'os'|'quote')
  - Criar interface `ClientHistory` com `serviceOrders: ClientHistoryItem[]` e `quotes: ClientHistoryItem[]`
  - Exportar novos tipos em `libs/shared-types/src/index.ts`
- [ ] TSK021 Criar `libs/shared-utils/src/lib/cpf-cnpj.utils.ts`
  - Implementar `isValidCpf(cpf: string): boolean` (strip máscara + validar dígitos verificadores)
  - Implementar `isValidCnpj(cnpj: string): boolean` (strip máscara + validar dígitos verificadores)
  - Cobrir casos-limite: strings vazias, CPF com todos dígitos iguais (111.111.111-11)
- [ ] TSK022 Adicionar testes unitários em `libs/shared-utils/src/lib/cpf-cnpj.utils.spec.ts`
  - CPF válido, CPF inválido, CPF com dígitos iguais, CNPJ válido, CNPJ inválido
- [ ] TSK023 Exportar `isValidCpf` e `isValidCnpj` em `libs/shared-utils/src/index.ts`
- [ ] TSK024 Rodar `npx nx test shared-utils` e confirmar verde

## Backend (NestJS)

- [ ] TSK030 Atualizar `apps/api/src/app/modules/clients/entities/client.entity.ts`
  - Adicionar `@Column({ type: 'date', nullable: true }) birthDate?: string`
  - Adicionar `@Column({ nullable: true }) gender?: 'M' | 'F' | 'other'`
- [ ] TSK031 Criar decorator customizado `IsCpfOrCnpj` usando `isValidCpf`/`isValidCnpj` de shared-utils
  - Localização: `apps/api/src/app/common/validators/cpf-cnpj.validator.ts`
  - Decorator valida: se `type === 'company'` → CNPJ; se `type === 'individual'` → CPF
  - Usar `ValidateIf` para tornar o campo condicional ao tipo
- [ ] TSK032 Atualizar `apps/api/src/app/modules/clients/dto/create-client.dto.ts`
  - Adicionar `@IsDateString() @IsOptional() birthDate?: string`
  - Adicionar `@IsIn(['M','F','other']) @IsOptional() gender?: 'M' | 'F' | 'other'`
  - Substituir validator de `cpfCnpj` pelo decorator criado em TSK031
- [ ] TSK033 Atualizar `apps/api/src/app/modules/clients/dto/update-client.dto.ts`
  - Herdar de `PartialType(CreateClientDto)` (se ainda não faz) — os novos campos são incluídos automaticamente
- [ ] TSK034 Implementar `getHistory(tenantId: string, clientId: string)` em `clients.service.ts`
  - Buscar `service_orders` com `clientId` e `tenantId` (não deletados) — retornar `id, code, status, createdAt`
  - Buscar `quotes` com `clientId` e `tenantId` (não deletados) — retornar `id, code, status, createdAt`
  - Limitar a 50 itens por tipo (ORDER BY createdAt DESC)
- [ ] TSK035 Adicionar endpoint `GET /:id/history` em `clients.controller.ts`
  - Retornar `ClientHistory` tipado
  - Aplicar `AuthGuard` e `PermissionGuard` com `clients:read`
- [ ] TSK036 Escrever testes de integração para o módulo de clients
  - POST com `birthDate` e `gender` → 201, dados persistidos
  - POST com CPF inválido → 400
  - POST com CNPJ inválido → 400
  - GET `/:id/history` → retornar arrays corretos
- [ ] TSK037 Rodar `npx nx test api` e confirmar verde

## Frontend (Angular)

- [ ] TSK040 Criar `apps/web/src/app/core/services/via-cep.service.ts`
  - Método `lookup(cep: string): Observable<ViaCepResponse | null>`
  - Timeout de 3 segundos (`timeout(3000)`)
  - Retornar `null` em caso de erro ou CEP não encontrado
  - Criar interface `ViaCepResponse` com os campos da API
- [ ] TSK041 Escrever testes unitários para `ViaCepService` (mock `HttpClient`)
  - CEP válido → retorna dados
  - CEP não encontrado (erro campo) → retorna null
  - Timeout → retorna null
- [ ] TSK042 Atualizar `client-form.component.ts`
  - Ampliar `FormGroup` com: `address` (FormGroup com zipCode, street, number, complement, neighborhood, city, state), `birthDate`, `gender`
  - Remover campo único `cpfCnpj` e substituir por `cpf` e `cnpj` separados com validators condicionais
  - Implementar validator Angular `cpfValidator` e `cnpjValidator` usando `isValidCpf`/`isValidCnpj`
  - Implementar lógica de CEP lookup: ao alterar `zipCode` com 8 dígitos, chamar `ViaCepService` e fazer `patchValue` nos campos de endereço
  - Implementar `cepLoading` signal e `cepError` signal para feedback ao usuário
  - Telefone: usar regex validator `^\d{10,11}$` (sem InputMask rígida)
- [ ] TSK043 Atualizar `client-form.component.html`
  - Seção "Dados Básicos": nome, tipo (SelectButton), telefone, telefone2, e-mail
  - Seção "Dados Pessoais" (visível apenas para PF): CPF, data de nascimento, sexo
  - Seção "Dados Empresariais" (visível apenas para PJ): CNPJ
  - Seção "Endereço": CEP (com spinner de loading), logradouro, número, complemento, bairro, cidade, estado
  - Mensagem de erro inline sob cada campo inválido
  - Feedback de CEP não encontrado
- [ ] TSK044 Atualizar `client-detail.component.ts`
  - Injetar `ClientsService`
  - Ao carregar, chamar `getHistory(clientId)` em paralelo com `getOne()`
  - Armazenar resultado em signals `serviceOrders` e `quotes`
- [ ] TSK045 Atualizar `client-detail.component.html`
  - Adicionar seção "Ordens de Serviço" com tabela/lista: código, status (badge), data — link para `/app/os/:id`
  - Adicionar seção "Orçamentos" com tabela/lista: código, status (badge), data — link para `/app/orcamentos/:id`
  - Mensagem "Nenhum registro encontrado." quando arrays estão vazios
  - Exibir novos campos: data de nascimento (formatada), sexo, endereço completo
- [ ] TSK046 Atualizar `clients.service.ts` (frontend)
  - Adicionar método `getHistory(id: string): Observable<ClientHistory>`
- [ ] TSK047 Rodar `npx nx lint web` e `npx nx test web` e confirmar verde

## Testes e qualidade

- [ ] TSK050 Testar manualmente fluxo completo PF: criação → detalhe com histórico
- [ ] TSK051 Testar manualmente fluxo PJ: CNPJ inválido → erro; CNPJ válido → salva
- [ ] TSK052 Testar CEP válido (lookup preenche endereço) e CEP inválido (mensagem de erro)
- [ ] TSK053 Testar formulário de edição carregando todos os campos novos
- [ ] TSK054 Rodar `npx nx affected --target=lint` e `npx nx affected --target=test`

## Entrega

- [ ] TSK060 Atualizar spec: Status → In Progress durante implementação, Done ao concluir
- [ ] TSK061 Abrir PR com link para esta spec
- [ ] TSK062 Conferir DoD no checklist.md e marcar spec como Done
