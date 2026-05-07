# Plano — Fluxo de Redefinição de Senha

Referência: `spec.md`

## Abordagem

Manter o **implicit flow** do Supabase (hash fragment com token) que já está funcionando parcialmente — só está faltando a allowlist correta e o componente receptor.

A abordagem PKCE (code + callback) seria mais moderna, mas exigiria alterar o `createClient` e o `AuthCallbackComponent`, com risco de quebrar o fluxo de signup/OAuth. O implicit flow resolve o problema com o menor número de mudanças.

Fluxo completo após a feature:
```
1. Usuário em /esqueci-senha → submete email
2. resetPasswordForEmail(email, { redirectTo: `${origin}/redefinir-senha` })
3. Supabase envia email → link aponta para `{origin}/redefinir-senha#access_token=...&type=recovery`
4. Browser navega para /redefinir-senha
5. Supabase JS client detecta hash fragment → dispara onAuthStateChange com evento PASSWORD_RECOVERY
6. AuthService seta isRecoverySession = true
7. ResetPasswordComponent exibe formulário (protegido por passwordRecoveryGuard)
8. Usuário preenche nova senha → updateUser({ password })
9. AuthService: isRecoverySession = false → refreshMe()
10. Router navega para /app/dashboard + toast de sucesso
```

## Arquitetura e decisões

**AuthService — mudanças:**
- Novo signal: `isRecoverySession = signal<boolean>(false)`
- No `onAuthStateChange`: if `event === 'PASSWORD_RECOVERY'` → `isRecoverySession.set(true)`
- Novo método: `async updatePassword(password: string)` — chama `supabase.auth.updateUser({ password })` → on success: `isRecoverySession.set(false)` → `await refreshMe()`

**passwordRecoveryGuard:**
```typescript
// CanActivate: bloqueia SAÍDA de /redefinir-senha
// Usado como canActivate na rota /redefinir-senha para garantir que só quem tem sessão de recovery acessa
// E como canDeactivate para impedir navegação para fora enquanto isRecoverySession === true
```

Duas responsabilidades distintas:
- `canActivate` → se `isRecoverySession === false` E não há token de recovery na URL → redirect `/login`
- `canDeactivate` → se `isRecoverySession === true` → bloqueia navegação (retorna `false`)

**ResetPasswordComponent:**
- Reactive Form: `{ password: [minLength(8)], passwordConfirm: [matching validator] }`
- Submit chama `authService.updatePassword(password)`
- Loading state durante o submit
- Em caso de erro: exibe mensagem (token expirado → redireciona `/esqueci-senha`)
- Reutiliza `AuthShellComponent` como wrapper (mesmo layout visual do login)

## Mudanças por camada

- **Web (Angular):**
  - `auth.service.ts`: + `isRecoverySession` signal + handler `PASSWORD_RECOVERY` + `updatePassword()`
  - `reset-password.component.ts/html`: novo componente standalone
  - `password-recovery.guard.ts`: guard com `canActivate` + `canDeactivate`
  - `app.routes.ts`: rota `/redefinir-senha` com `canActivate: [passwordRecoveryGuard]` e `canDeactivate: [passwordRecoveryGuard]`
  - `app.routes.server.ts`: `/redefinir-senha` → strategy `Client`

- **API (NestJS/TypeORM):** nenhuma alteração

- **Banco (Postgres/Supabase/RLS):** nenhuma alteração
  - Configuração manual no Supabase Dashboard (não versionável em código):
    - Site URL: `https://simplificaos.vercel.app`
    - Redirect URLs allowlist: `http://localhost:4200/**` e `https://simplificaos.vercel.app/**`

- **Shared (`libs/shared-types`, etc.):** nenhuma alteração

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Token expira antes do usuário abrir o email (> 1h) | Média | AC07: detectar erro de sessão inválida e redirecionar para `/esqueci-senha` com toast explicativa |
| `canDeactivate` não funciona com navegação pelo botão "voltar" do browser | Baixa | Testar manualmente; como fallback, o guard redireciona de volta via `onAuthStateChange` |
| Deploy sem configurar o Supabase Dashboard primeiro | Alta | Documentar no `spec.md` como pré-requisito de deploy. Incluir no checklist |
| Usuário acessa `/redefinir-senha` diretamente sem token | Média | `canActivate` verifica `isRecoverySession` — redireciona para `/login` |

## Estratégia de validação

- AC01: Verificar manualmente URL do link no email após configurar allowlist no Supabase
- AC02: Adicionar log no `onAuthStateChange` para confirmar evento `PASSWORD_RECOVERY`; unit test no service
- AC03: Navegar diretamente para `/redefinir-senha` sem recovery session → deve ir para `/login`
- AC04: Abrir DevTools → tentar navegar para `/app/dashboard` enquanto na tela de reset → deve voltar
- AC05: Submeter form com senha < 8 chars e senhas diferentes → validações visíveis
- AC06: Preencher corretamente → verificar redirect, toast e que nova senha funciona no login
- AC07: Usar link de email expirado → verificar redirect para `/esqueci-senha`
