# Plano — Refatoração do Formulário de Clientes

Referência: `spec.md`

## Abordagem

Implementação em 4 camadas sequenciais: banco → shared types → backend → frontend.
Migração é additive (colunas nullable), então não há risco de regressão em dados existentes.
A validação de CPF/CNPJ será implementada como função utilitária em `libs/shared-utils` e
reutilizada tanto no frontend (validator Angular) quanto no backend (decorator class-validator).

O histórico do cliente será servido via endpoint dedicado `GET /api/clients/:id/history` que
retorna arrays de OSs e orçamentos resumidos — evita inflar o response padrão de `GET /api/clients/:id`.

## Arquitetura e decisões

- **CPF/CNPJ validators em shared-utils:** uma única implementação dos algoritmos de dígitos
  verificadores, reutilizada por frontend e backend. Evita duplicação e divergência.
- **ViaCEP no frontend apenas:** não faz sentido proxiar via backend. A API é pública, sem CORS
  restritivo, e o dado é usado exclusivamente para preencher campos no formulário. Criar
  `ViaCepService` em `apps/web/src/app/core/services/via-cep.service.ts`.
- **Máscara de telefone dinâmica:** PrimeNG `InputMask` não suporta dois padrões ao mesmo tempo.
  Usar `ngx-mask` ou implementar lógica de máscara condicional: ao digitar, se o 5º dígito (após
  DDD) for `9`, aplica máscara 11 dígitos; caso contrário, aplica 10. Alternativa mais simples:
  um único campo sem máscara rígida, com validação de 10-11 dígitos numéricos via regex.
- **Campo `gender` como select:** 3 opções fixas (M/F/Outro) — não justifica tabela de lookup.
- **`birthDate` como date picker:** usar `p-datepicker` (PrimeNG) com `maxDate = hoje`.
- **Histórico paginado:** AC11-AC13 não exigem paginação na v1. Retornar listas completas
  limitadas a 50 registros para não sobrecarregar. Paginar em sprint futuro.

## Mudanças por camada

### Banco (Postgres/Supabase)
- Migration: `supabase/migrations/YYYYMMDD_add_birth_date_gender_to_clients.sql`
  ```sql
  ALTER TABLE public.clients
    ADD COLUMN birth_date DATE,
    ADD COLUMN gender     TEXT CHECK (gender IN ('M', 'F', 'other'));
  ```
- Sem alteração em RLS (colunas do mesmo tenant).

### Shared (`libs/shared-types` e `libs/shared-utils`)
- `client.types.ts`: adicionar `birthDate?: string` e `gender?: 'M' | 'F' | 'other'` à interface `Client`
- Adicionar interface `ClientHistoryItem` (os/quote sumário) e `ClientHistory`
- `libs/shared-utils`: criar `cpf-cnpj.utils.ts` com `isValidCpf(cpf: string): boolean` e `isValidCnpj(cnpj: string): boolean`

### API (NestJS/TypeORM)
- `client.entity.ts`: adicionar `birthDate` (`@Column({ type: 'date', nullable: true })`) e `gender`
- `create-client.dto.ts` e `update-client.dto.ts`: adicionar campos com decorators de validação
  - `@IsDateString() @IsOptional()` para `birthDate`
  - `@IsIn(['M','F','other']) @IsOptional()` para `gender`
  - Substituir `@IsString() @IsOptional()` em `cpfCnpj` por decorator customizado `@IsCpfOrCnpj()`
    que chama `isValidCpf`/`isValidCnpj` de `shared-utils`
- `clients.controller.ts`: adicionar endpoint `GET /:id/history` que retorna `{ serviceOrders, quotes }`
- `clients.service.ts`: implementar `getHistory(tenantId, clientId)` — query em `service_orders` e `quotes`

### Web (Angular)
- `client-form.component.ts`: ampliar `FormGroup` com novos campos; criar `ViaCepService`;
  adicionar validators de CPF/CNPJ; lógica de exibição condicional (PF vs PJ)
- `client-form.component.html`: adicionar seções de endereço, dados pessoais (PF), dados empresariais (PJ)
- `client-detail.component.ts`: chamar `getHistory()` ao carregar; guardar resultado em signals
- `client-detail.component.html`: adicionar seção "Histórico" com duas sub-seções (OS e Orçamentos)
- Criar `ViaCepService` em `apps/web/src/app/core/services/via-cep.service.ts`

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| ViaCEP indisponível ou lento | Timeout de 3s; se falhar, exibir aviso e manter campos editáveis |
| Dados existentes sem `birthDate`/`gender` | Colunas nullable — sem impacto em registros existentes |
| Máscara de telefone quebrar validação existente | Usar regex simples `^\d{10,11}$` em vez de InputMask, evitando conflito |
| CPF/CNPJ com máscara sendo validados com pontuação | Strip de pontuação antes de validar (remover `.`, `-`, `/`) |

## Estratégia de validação

- **AC01:** teste manual — alternar SelectButton e verificar visibilidade dos campos
- **AC02/AC03:** unit test dos validators; teste manual com CPF/CNPJ inválido no formulário
- **AC04:** já coberto por `Validators.email` Angular — confirmar visualmente
- **AC05/AC06:** unit test do `ViaCepService` (mock HttpClient); teste manual com CEP real e CEP falso
- **AC07:** digitar número com 10 e 11 dígitos e confirmar aceite sem erro
- **AC08:** teste de integração NestJS — POST com `birthDate` e `gender`; verificar persistência
- **AC09/AC10:** teste de integração NestJS — POST com CPF/CNPJ inválido → esperar 400
- **AC11/AC12/AC13:** teste manual em detalhe de cliente com e sem histórico
- **AC14:** teste manual edição de cliente existente
