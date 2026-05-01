# Checklist: Refatoração do Formulário de Clientes

Criada em: 2026-04-30
Referência: `spec.md`

## Produto

- [ ] CA01 Todos os 14 critérios de aceite da spec foram verificados manualmente
- [ ] CA02 Não-objetivos não foram implementados (sem paginação, sem WhatsApp, sem novos guards)
- [ ] CA03 Campos condicionais PF/PJ funcionam corretamente ao alternar tipo
- [ ] CA04 Histórico de OS e orçamentos exibido na tela de detalhe

## Dados e Persistência

- [ ] DAT01 Migration aplicada e colunas `birth_date` e `gender` existem na tabela `clients`
- [ ] DAT02 Clientes existentes (sem os novos campos) continuam funcionando normalmente
- [ ] DAT03 Criação de PF com `birthDate` e `gender` persiste corretamente
- [ ] DAT04 Edição de cliente existente não apaga campos não enviados

## Validações

- [ ] VAL01 CPF válido aceito; CPF inválido (dígitos verificadores) rejeitado com mensagem inline
- [ ] VAL02 CPF com dígitos iguais (ex: 111.111.111-11) rejeitado
- [ ] VAL03 CNPJ válido aceito; CNPJ inválido rejeitado com mensagem inline
- [ ] VAL04 E-mail inválido rejeitado
- [ ] VAL05 Telefone aceita 10 e 11 dígitos numéricos; rejeita menos de 10 ou mais de 11
- [ ] VAL06 Backend retorna 400 para CPF inválido (teste com curl/Insomnia)
- [ ] VAL07 Backend retorna 400 para CNPJ inválido

## CEP / Endereço

- [ ] CEP01 CEP válido (ex: 01310-100) → campos preenchidos via ViaCEP
- [ ] CEP02 CEP inválido → mensagem de aviso; campos permanecem editáveis
- [ ] CEP03 Falha de rede / timeout → mensagem de aviso; campos permanecem editáveis
- [ ] CEP04 Campo número permanece vazio após lookup (preenchimento manual)

## Segurança / Tenancy

- [ ] SEC01 Endpoint `GET /clients/:id/history` aplica filtro `tenantId` — cliente de tenant A não retorna dados de tenant B
- [ ] SEC02 Permissões RBAC não foram alteradas; guards existentes continuam em vigor
- [ ] SEC03 Dados do ViaCEP não são armazenados no backend; apenas usados para preencher formulário

## Qualidade

- [ ] QLT01 Testes unitários de `isValidCpf` e `isValidCnpj` passando (shared-utils)
- [ ] QLT02 Testes unitários de `ViaCepService` passando
- [ ] QLT03 Testes de integração do módulo clients passando (birthDate, gender, history)
- [ ] QLT04 `npx nx affected --target=lint` sem erros
- [ ] QLT05 `npx nx affected --target=test` sem falhas
- [ ] QLT06 Sem erros de TypeScript em nenhum projeto afetado
