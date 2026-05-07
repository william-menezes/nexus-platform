# Tarefas — Fluxo de Redefinição de Senha

Referência: `spec.md` e `plan.md`

## Preparação

- [ ] TSK001 Configurar Supabase Dashboard: Site URL = `https://simplificaos.vercel.app`; Redirect URLs allowlist = `http://localhost:4200/**` e `https://simplificaos.vercel.app/**`
- [ ] TSK002 Confirmar que o link do email após a config aponta para `{origin}/redefinir-senha#...` (testar manualmente)

## Backend

- Nenhuma tarefa de backend necessária

## Frontend

- [ ] TSK010 `auth.service.ts`: adicionar signal `isRecoverySession`, detectar evento `PASSWORD_RECOVERY` em `onAuthStateChange`, implementar `updatePassword(password: string)`
- [ ] TSK011 Criar `apps/web/src/app/core/guards/password-recovery.guard.ts` com `canActivate` (bloqueia acesso sem recovery session) e `canDeactivate` (bloqueia saída enquanto recovery ativa)
- [ ] TSK012 Criar `reset-password.component.ts` com Reactive Form (senha + confirmação), submit handler, loading state, tratamento de erro (token expirado)
- [ ] TSK013 Criar `reset-password.component.html` usando o layout de `auth-shell` — visual consistente com tela de login
- [ ] TSK014 Adicionar rota `/redefinir-senha` em `app.routes.ts` com `canActivate: [passwordRecoveryGuard]`, `canDeactivate: [passwordRecoveryGuard]`, lazy load do componente
- [ ] TSK015 Adicionar `/redefinir-senha` em `app.routes.server.ts` com `RenderMode.Client`

## Testes e qualidade

- [ ] TSK020 `auth.service.spec.ts`: testar que `isRecoverySession` vai para `true` no evento `PASSWORD_RECOVERY`; testar `updatePassword()` reseta a flag
- [ ] TSK021 `password-recovery.guard.spec.ts`: testar `canActivate` redireciona para `/login` quando `isRecoverySession === false`; testar `canDeactivate` bloqueia quando `isRecoverySession === true`
- [ ] TSK022 `reset-password.component.spec.ts`: validação de senha curta (< 8 chars), senhas diferentes, submit desabilitado com form inválido
- [ ] TSK023 Rodar `npx nx affected --target=lint --base=main`
- [ ] TSK024 Rodar `npx nx affected --target=test --base=main`

## Testes manuais

- [ ] TSK025 Testar fluxo completo em `localhost:4200`: solicitar reset → clicar no link → redefinir → logar com nova senha
- [ ] TSK026 Testar fluxo completo em `simplificaos.vercel.app` após deploy
- [ ] TSK027 Testar bloqueio de navegação: estando em `/redefinir-senha`, tentar ir para `/app/dashboard` via URL direta — deve voltar
- [ ] TSK028 Testar token expirado: aguardar > 1h após solicitar reset → clicar no link → deve redirecionar para `/esqueci-senha` com mensagem

## Entrega

- [ ] TSK030 Atualizar status da spec para `Done`
- [ ] TSK031 Confirmar todos os ACs (AC01–AC07) verificados
