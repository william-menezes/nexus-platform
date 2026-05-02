# Refatoração do Formulário de Clientes

Status: In Progress
Owner: [@william.damascena]
Criada em: 2026-04-30
Links: —

## Contexto

O formulário atual de cadastro de clientes é mínimo: captura apenas nome, tipo, cpfCnpj, e-mail,
telefone e notas. Faltam campos essenciais para o contexto de assistência técnica brasileira —
data de nascimento, sexo, campos individuais de CPF/CNPJ e endereço completo com lookup automático
via CEP. Além disso, a tela de detalhes do cliente não exibe o histórico de atendimentos (OS e
orçamentos), o que força o operador a navegar em outras telas para ver o relacionamento.

A refatoração cobre frontend (formulário + detalhe) e backend (entidade, DTO, validações).

## Objetivos

- [ ] Ampliar o modelo `Client` com os campos faltantes (birthDate, gender)
- [ ] Separar explicitamente os campos CPF e CNPJ no formulário (condicionais ao tipo)
- [ ] Validar CPF e CNPJ (formato + dígitos verificadores) no frontend e no backend
- [ ] Validar e-mail no frontend e no backend (já existe, manter)
- [ ] Suportar máscaras de telefone com 10 ou 11 dígitos (incluindo DDD)
- [ ] Preencher automaticamente campos de endereço ao digitar o CEP (ViaCEP)
- [ ] Exibir histórico de OS e orçamentos na tela de detalhe do cliente

## Não-objetivos

- [ ] Criar nova seção de relatórios por cliente
- [ ] Implementar paginação no histórico de OS/orçamentos (na primeira versão exibe tudo)
- [ ] Enviar comunicação automática ao cliente (WhatsApp/e-mail)
- [ ] Alterar fluxo de rota ou guards de permissão

## Usuários e cenários

### Cenário 1 — Cadastro de pessoa física

**Dado** que o operador acessa `/app/clientes/novo`
**Quando** seleciona tipo "Pessoa Física" e preenche: nome, CPF, e-mail, telefone (11 dígitos), data de nascimento, sexo e CEP
**Então** os campos de endereço são preenchidos automaticamente via ViaCEP, o formulário valida o CPF e, ao salvar, o cliente é criado com todos os dados persistidos

### Cenário 2 — Cadastro de pessoa jurídica

**Dado** que o operador acessa `/app/clientes/novo`
**Quando** seleciona tipo "Pessoa Jurídica"
**Então** os campos CPF, data de nascimento e sexo ficam ocultos e o campo CNPJ aparece com validação e máscara 00.000.000/0000-00

### Cenário 3 — CEP inválido

**Dado** que o operador está preenchendo o endereço
**Quando** digita um CEP que não existe na base ViaCEP
**Então** uma mensagem de aviso é exibida abaixo do campo e os campos de endereço permanecem editáveis manualmente

### Cenário 4 — Edição de cliente existente

**Dado** que existe um cliente cadastrado com dados incompletos (sem endereço)
**Quando** o operador acessa a tela de edição
**Então** o formulário carrega os dados existentes, os campos novos ficam em branco para preenchimento

### Cenário 5 — Histórico no detalhe do cliente

**Dado** que o operador acessa `/app/clientes/:id`
**Quando** a tela carrega
**Então** além dos dados do cliente são exibidas as OSs e os orçamentos vinculados a ele, cada item com link para navegação

## Regras de negócio

- **RN01 (Soft delete):** aplicável — a entidade `clients` já usa `deleted_at`.
- **RN04 (Códigos auto-gerados):** não se aplica a clients.
- **RN11 (Permissões):** formulário exige permissão `clients:create` ou `clients:update`; detalhe exige `clients:read`. Não alterar guards existentes.
- **RN-CEPAPI:** requisição à ViaCEP é feita somente no frontend (sem proxy backend). Se a API retornar erro (404 ou timeout), exibir aviso e manter campos editáveis.
- **RN-CPF-VALID:** validação de CPF deve verificar os dois dígitos verificadores, não apenas o formato. CPFs mascarados (111.111.111-11, 000.000.000-00 etc.) devem ser rejeitados.
- **RN-CNPJ-VALID:** mesma lógica — validar dígitos verificadores do CNPJ.
- **RN-PHONE-MASK:** aceitar 10 dígitos (DDD + 8 dígitos, fixo) e 11 dígitos (DDD + 9 dígitos, celular). A máscara deve ser dinâmica ou utilizar dois padrões opcionais.
- **RN-GENDER:** campo sexo é opcional. Valores permitidos: `M` (Masculino), `F` (Feminino), `other` (Outro/Prefiro não informar).
- **RN-BIRTHDATE:** data de nascimento é opcional. Deve impedir datas futuras.

## Critérios de aceite

- AC01 — Ao selecionar tipo "Pessoa Física", os campos CPF, data de nascimento e sexo são exibidos; CNPJ fica oculto. Ao selecionar "Pessoa Jurídica", ocorre o inverso.
- AC02 — CPF inválido (dígitos verificadores errados) exibe mensagem de erro inline e impede submissão do formulário.
- AC03 — CNPJ inválido exibe mensagem de erro inline e impede submissão.
- AC04 — E-mail inválido exibe mensagem de erro inline e impede submissão.
- AC05 — Ao preencher um CEP válido com 8 dígitos, os campos logradouro, bairro, cidade e estado são preenchidos automaticamente. O campo número permanece em branco para preenchimento manual.
- AC06 — Ao preencher um CEP inexistente, mensagem "CEP não encontrado. Preencha o endereço manualmente." é exibida e os campos ficam habilitados.
- AC07 — Campos de telefone aceitam números com 10 dígitos (fixo com DDD) e 11 dígitos (celular com DDD).
- AC08 — Ao salvar pessoa física com todos os campos, o backend persiste `birthDate` e `gender` corretamente.
- AC09 — Backend retorna erro 400 se CPF for enviado inválido (dígitos verificadores).
- AC10 — Backend retorna erro 400 se CNPJ for enviado inválido.
- AC11 — A tela de detalhe do cliente exibe, abaixo dos dados cadastrais, uma seção com as OSs vinculadas ao cliente (código, status, data) com link para cada uma.
- AC12 — A tela de detalhe exibe uma seção com os orçamentos vinculados ao cliente (código, status, data) com link para cada um.
- AC13 — Quando o cliente não tem OS nem orçamentos, as seções exibem mensagem "Nenhum registro encontrado."
- AC14 — O formulário de edição carrega todos os campos novos corretamente para um cliente já existente.

## Impacto técnico (rascunho)

- **Projetos Nx afetados:** `web`, `api`, `libs/shared-types`
- **API — endpoints alterados:**
  - `POST /api/clients` — DTO ampliado
  - `PATCH /api/clients/:id` — DTO ampliado
  - `GET /api/clients/:id` — response ampliado
  - `GET /api/clients/:id` com param `?include=service-orders,quotes` (ou endpoint separado `GET /api/clients/:id/history`)
- **Banco — tabelas:**
  - `clients`: adicionar colunas `birth_date DATE` e `gender TEXT CHECK (gender IN ('M','F','other'))`
  - Criar migração Supabase em `supabase/migrations/`
- **Shared types (`libs/shared-types`):**
  - `Client` interface: adicionar `birthDate?: string` e `gender?: 'M' | 'F' | 'other'`
  - Criar `ClientHistory` interface para o resultado do histórico
- **Permissões (RBAC):** sem alteração — endpoints de client já têm guards
- **Observabilidade:** ações de create/update já são logadas pelo `AuditInterceptor` — nenhuma alteração necessária
- **Dependência externa:** API ViaCEP (`https://viacep.com.br/ws/{cep}/json/`) — somente frontend, sem chave de API

## Plano de testes

- **Unit (backend):** validators CPF/CNPJ customizados do class-validator
- **Unit (frontend):** funções `validateCpf()` e `validateCnpj()` em `shared-utils`; `ViaCepService`
- **Integração:** `ClientsService` (NestJS) — testar que `birthDate` e `gender` são persistidos; erro 400 para CPF/CNPJ inválidos
- **E2E/manual:** fluxo completo de criação PF + CEP lookup; criação PJ; detalhe com histórico

## Rollout

- Feature flag? não — substituição direta (formulário existente é tela interna)
- Backwards compatibility: migração additive (colunas nullable) — dados existentes não quebram
- Migrações: 1 migration SQL (`add_birth_date_gender_to_clients.sql`)
