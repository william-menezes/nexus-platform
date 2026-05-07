# Fluxo de Redefinição de Senha

Status: Draft  
Owner: @william  
Criada em: 2026-05-02  
Links: —

## Contexto

O fluxo de "esqueci minha senha" existe mas está incompleto. Quando o usuário clica no link recebido por email, o Supabase redireciona para `http://localhost:4200/#access_token=...&type=recovery` — sem o caminho `/redefinir-senha` e sem nenhuma tela para ele inserir a nova senha.

Dois problemas raiz:
1. **Supabase Allowlist ausente:** o `redirectTo` passado em `resetPasswordForEmail` (`/redefinir-senha`) não está cadastrado na allowlist do Supabase, então o serviço ignora o path e redireciona para a raiz do Site URL.
2. **Componente inexistente:** a rota `/redefinir-senha` não existe no Angular — não há componente nem guard associado.

## Objetivos

- [x] Configurar o Supabase para aceitar redirects para `localhost:4200/redefinir-senha` e `simplificaos.vercel.app/redefinir-senha`
- [x] Criar a tela `/redefinir-senha` com formulário de nova senha + confirmação
- [x] Criar guard `passwordRecoveryGuard` que impeça o usuário de navegar para fora sem ter definido uma nova senha
- [x] Atualizar `AuthService` para rastrear o evento `PASSWORD_RECOVERY` e expor `updatePassword()`
- [x] Garantir que o fluxo funcione em **desenvolvimento** (`localhost:4200`) e **produção** (`simplificaos.vercel.app`)

## Não-objetivos

- Não alterar o fluxo de signup/login existente
- Não implementar autenticação por magic link (escopo separado)
- Não adicionar 2FA ao fluxo de recovery
- Não criar tela de sucesso separada (usar toast + redirect para `/app/dashboard`)

## Usuários e cenários

### Cenário 1 — Recovery em desenvolvimento (localhost)

**Dado** que o usuário clicou em "Esqueci minha senha" com seu email  
**E** o app está rodando em `localhost:4200`  
**Quando** o usuário clica no link recebido no email  
**Então** o browser abre `http://localhost:4200/redefinir-senha#access_token=...&type=recovery`  
**E** o usuário já está logado com uma sessão de recovery  
**E** vê o formulário de nova senha + confirmação  
**E** não consegue navegar para nenhuma outra rota até definir a senha

### Cenário 2 — Recovery em produção (Vercel)

**Dado** que o usuário clicou em "Esqueci minha senha" com seu email  
**E** o app está em `https://simplificaos.vercel.app`  
**Quando** o usuário clica no link recebido no email  
**Então** o browser abre `https://simplificaos.vercel.app/redefinir-senha#access_token=...&type=recovery`  
**E** o fluxo ocorre identicamente ao Cenário 1

### Cenário 3 — Usuário tenta sair sem redefinir

**Dado** que o usuário está na tela `/redefinir-senha` (sessão de recovery ativa)  
**Quando** tenta navegar para `/app/dashboard` (URL direta ou botão voltar)  
**Então** é redirecionado de volta para `/redefinir-senha`  
**E** a sessão de recovery permanece ativa

### Cenário 4 — Redefinição bem-sucedida

**Dado** que o usuário preenche nova senha válida e confirmação iguais  
**Quando** clica em "Redefinir senha"  
**Então** a senha é atualizada no Supabase  
**E** o guard é desativado (flag de recovery limpa)  
**E** o usuário é redirecionado para `/app/dashboard`  
**E** uma toast de sucesso é exibida

### Cenário 5 — Token expirado ou inválido

**Dado** que o usuário acessa `/redefinir-senha` com token expirado (> 1h) ou URL inválida  
**Quando** o Supabase rejeita a sessão  
**Então** o usuário é redirecionado para `/esqueci-senha`  
**E** uma mensagem de erro orienta a solicitar novo email

## Regras de negócio

- RNS01: O `passwordRecoveryGuard` deve bloquear **qualquer** navegação que saia de `/redefinir-senha` enquanto a flag `isRecoverySession` estiver ativa
- RNS02: A nova senha deve ter mínimo 8 caracteres (mesma regra do signup)
- RNS03: Após `updateUser()` bem-sucedido, a flag `isRecoverySession` é limpa **antes** do redirect
- RNS04: Se o usuário acessar `/redefinir-senha` sem uma sessão de recovery ativa (acesso direto via URL), deve ser redirecionado para `/login`
- RNS05: O `redirectTo` em `resetPasswordForEmail` deve usar `window.location.origin` para funcionar em qualquer ambiente dinamicamente

## Critérios de aceite

- AC01: Email de recovery redireciona para `{origin}/redefinir-senha#access_token=...&type=recovery` (com o path `/redefinir-senha` correto) em ambos os ambientes
- AC02: `onAuthStateChange` dispara evento `PASSWORD_RECOVERY` e `isRecoverySession` signal do `AuthService` vai para `true`
- AC03: Rota `/redefinir-senha` renderiza o `ResetPasswordComponent` sem precisar estar autenticado normalmente (mas com sessão de recovery ativa)
- AC04: Navegação para fora de `/redefinir-senha` enquanto `isRecoverySession === true` é bloqueada pelo guard e redireciona de volta
- AC05: Formulário valida senha mínimo 8 caracteres e igualdade de confirmação antes de submeter
- AC06: Após submit bem-sucedido: senha atualizada, flag limpa, redirect para `/app/dashboard`, toast de sucesso visível
- AC07: Token expirado/inválido → redirect para `/esqueci-senha` com mensagem explicativa

## Configurações Supabase necessárias

No painel do Supabase → Authentication → URL Configuration:

**Site URL:**
```
https://simplificaos.vercel.app
```
(usado como fallback quando nenhum redirectTo está na allowlist)

**Redirect URLs (allowlist):**
```
http://localhost:4200/**
https://simplificaos.vercel.app/**
```
O wildcard `/**` cobre qualquer path dentro de cada domínio, incluindo `/redefinir-senha`.

> **Por que isso resolve o problema?** O `resetPasswordForEmail` já passa `redirectTo: ${window.location.origin}/redefinir-senha`. Com o domínio na allowlist, o Supabase aceita o URL completo (com path) e o link do email direciona para `/redefinir-senha` com o token no hash fragment.

## Impacto técnico

- Projetos Nx afetados: `web`
- API: nenhuma alteração
- Banco: nenhuma alteração
- Permissões (RBAC): rota pública (não precisa de tenant, nem de role)
- SSR: `/redefinir-senha` deve ter strategy `Client` (acessa hash fragment e session)

**Arquivos a criar:**
- `apps/web/src/app/features/auth/reset-password/reset-password.component.ts`
- `apps/web/src/app/features/auth/reset-password/reset-password.component.html`
- `apps/web/src/app/core/guards/password-recovery.guard.ts`

**Arquivos a modificar:**
- `apps/web/src/app/core/auth/auth.service.ts` — adicionar `isRecoverySession` signal + `updatePassword()` + detectar evento `PASSWORD_RECOVERY`
- `apps/web/src/app/app.routes.ts` — adicionar rota `/redefinir-senha` com `passwordRecoveryGuard`
- `apps/web/src/app/app.routes.server.ts` — adicionar `/redefinir-senha` com strategy `Client`

## Plano de testes

- Unit: `auth.service.spec.ts` — testar que `isRecoverySession` vai para `true` no evento `PASSWORD_RECOVERY` e volta para `false` após `updatePassword()`
- Unit: `password-recovery.guard.spec.ts` — testar redirecionamento quando flag ativa vs. inativa
- Unit: `reset-password.component.spec.ts` — validação de formulário (senha curta, senhas diferentes)
- Manual: testar link de email em `localhost:4200` e em `simplificaos.vercel.app`

## Rollout

- Feature flag: não (fluxo de correção crítica)
- Backwards compatibility: compatível — apenas adiciona rota e componente novos
- Migrações: nenhuma
- Configuração externa obrigatória: cadastrar URLs no Supabase Dashboard antes de fazer deploy
