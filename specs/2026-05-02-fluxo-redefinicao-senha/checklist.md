# Checklist — Fluxo de Redefinição de Senha

Criada em: 2026-05-02  
Referência: `spec.md`

## Produto

- [ ] CA01 Critérios de aceite AC01–AC07 revisados e objetivos claros
- [ ] CA02 Não-objetivos explícitos (2FA, magic link fora de escopo)

## Pré-deploy (Supabase Dashboard)

- [ ] SB01 Site URL configurado: `https://simplificaos.vercel.app`
- [ ] SB02 Redirect URL allowlist contém `http://localhost:4200/**`
- [ ] SB03 Redirect URL allowlist contém `https://simplificaos.vercel.app/**`

## Segurança

- [ ] SEC01 `canActivate` do guard impede acesso direto à `/redefinir-senha` sem recovery session (sem vazamento de tela)
- [ ] SEC02 `canDeactivate` impede que usuário escape sem definir senha
- [ ] SEC03 Token de recovery não é armazenado em localStorage além do que o Supabase JS faz por padrão
- [ ] SEC04 Acesso direto à rota sem recovery session → redireciona para `/login` (não mostra form vazio)

## Qualidade

- [ ] QLT01 Testes unitários cobrindo: `isRecoverySession` signal, `updatePassword()`, guard `canActivate`, guard `canDeactivate`, validação de form
- [ ] QLT02 Lint e testes passando (`npx nx affected --target=lint,test`)
- [ ] QLT03 Fluxo testado manualmente nos dois ambientes (localhost + Vercel)
- [ ] QLT04 Caso de erro (token expirado) tratado com UX clara
