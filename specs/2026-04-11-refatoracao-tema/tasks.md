# Tarefas — Refatoração de Tema — Identidade Visual SimplificaOS

Referência: `spec.md` e `plan.md`

---

## Preparação

- [x] TSK001 Ler `plan.md` e confirmar os 6 ACs antes de começar
- [x] TSK002 Rodar grep de segurança para mapear todo uso de orange/amber como cor primária:
  ```bash
  # Laranja via Tailwind
  grep -r "orange\|amber\|text-primary-\|bg-primary-\|border-primary-" apps/web/src --include="*.html" --include="*.ts" -l

  # Laranja hardcoded em CSS
  grep -r "#a63b00\|#F97316\|#FB923C\|#EA580C\|#FFA500" apps/web/src -l
  ```
  Anotar todos os arquivos retornados antes de editar.

---

## Implementação — Configuração global

- [x] TSK010 Corrigir `tailwind.config.js` — paleta `primary` para azul:
  ```js
  primary: {
    50:      '#eff6ff',
    100:     '#dbeafe',
    200:     '#bfdbfe',
    300:     '#93c5fd',
    400:     '#60a5fa',
    500:     '#3b82f6',
    600:     '#2563eb',
    700:     '#1d4ed8',
    800:     '#1e40af',
    900:     '#1e3a8a',
    950:     '#172554',
    DEFAULT: '#2563eb',
  }
  ```
  **Validação:** `npx nx build web` sem erros.

- [x] TSK011 Corrigir `tailwind.config.js` — fonte de `Manrope` para `Inter`:
  ```js
  fontFamily: {
    sans:    ['Inter', 'system-ui', 'sans-serif'],
    display: ['Inter', 'system-ui', 'sans-serif'],
    mono:    ['Inconsolata', 'monospace'],
  }
  ```
  **Validação:** DevTools → body `font-family` computed = `Inter`.

- [x] TSK012 Adicionar tokens de superfície no `tailwind.config.js` (permite `bg-surface` nos templates):
  ```js
  // dentro de theme.extend.colors:
  surface: {
    DEFAULT: 'var(--bg-card)',
    light:   'var(--bg-light)',
    border:  'var(--border-color)',
  }
  ```
  **Validação:** build sem erro; classe `bg-surface` funciona num template de teste.

- [x] TSK013 Verificar `apps/web/src/index.html` — garantir que `Inter` é carregada:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  ```
  Se já existir um `<link>` para `Manrope`, substituir. Não duplicar se `Inter` já estiver presente.
  **Validação:** aba Network mostra requisição para `fonts.googleapis.com?family=Inter`.

---

## Implementação — Correções pontuais de cor

- [x] TSK014 ~~Corrigir `landing.component.html` linhas 220-221~~ — **Inspecionado: amber semântico em ambas as ocorrências.** As linhas 135 e 220-221 exibem o status "Ag. peça" de uma OS mockup; amber é correto semanticamente. Nenhuma alteração necessária.

- [x] TSK015 Corrigir `apps/web/src/app/features/admin/components/admin-dashboard/admin-dashboard.component.ts` — valor de trial tenants (~linha 35):
  - `text-amber-500` → `text-blue-600`
  **Validação:** `/admin/dashboard` exibe o número de trials em azul.

---

## Implementação — Varredura final

- [x] TSK016 Executar grep do TSK002 novamente após correções; tratar ocorrências restantes de orange/amber não-semânticas. Documentar com comentário inline os ambers **mantidos intencionalmente** (`<!-- status: ag. peça — amber semântico -->`).

- [x] TSK017 Grep por `p-button-warning` nos templates — verificar se o uso é aviso real ou era substituto de primário; corrigir os não-semânticos para `p-button-primary`:
  ```bash
  grep -r "p-button-warning" apps/web/src --include="*.html" -n
  ```

---

## Testes e qualidade

- [x] TSK020 Build completo sem erros: `npx nx build web` — OK (warnings de budget preexistentes, zero erros)

- [ ] TSK021 Lint sem erros:
  ```bash
  npx nx lint web
  ```

- [ ] TSK022 Inspeção visual manual — modo claro (todas as 5 rotas):

  | Rota | O que verificar |
  |---|---|
  | `/` | CTA buttons azuis; ícone de feature azul; badge "Ag. peça" amber (ok) |
  | `/login` | Botão "Entrar" azul; sem laranja |
  | `/app/dashboard` | Botões de ação, badges de status semânticos |
  | `/app/os` | Botão "Nova OS" azul; status com cores corretas |
  | `/admin/dashboard` | Valor de trial tenants em azul |

- [ ] TSK023 Inspeção visual manual — modo escuro:
  ```js
  // No console do browser:
  document.documentElement.classList.toggle('dark')
  ```
  Repetir verificação das 5 rotas; sem cores laranja, contraste adequado em fundo escuro.

- [ ] TSK024 Verificar tipografia via DevTools:
  - `body` computed `font-family` começa com `Inter`
  - `.nx-page-title` exibido com `Inter`, peso 800

---

## Entrega

- [ ] TSK030 Atualizar `spec.md` — campo `Status:` para `Done`
- [ ] TSK031 Conferir DoD no `checklist.md` e marcar todos os itens concluídos
- [ ] TSK032 Commit: `fix: corrigir paleta primary e tipografia para identidade visual SimplificaOS`
