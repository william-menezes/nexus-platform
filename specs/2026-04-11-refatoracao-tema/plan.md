# Plano — Refatoração de Tema — Identidade Visual SimplificaOS

Referência: `spec.md`

## Abordagem

A raiz do problema é o `tailwind.config.js` definindo `primary` como laranja (`#a63b00`), em conflito com o design system em `styles.css` e o preset do PrimeNG. A correção segue uma única direção: **`styles.css` é a fonte de verdade das cores**; o Tailwind config e o PrimeNG preset devem refletir os mesmos tokens.

Estratégia:
1. Corrigir `tailwind.config.js` para alinhar `primary` com a escala de azul já definida
2. Corrigir as 4 ocorrências de `amber` usadas como cor primária/destaque neutro (manter apenas amber semântico de status)
3. Unificar tipografia (`Inter`)
4. Validação visual em inspeção manual nas rotas principais

**Por que Tailwind e não SCSS?** O projeto já usa classes Tailwind extensivamente nos templates Angular. Manter a lógica de cor nos utilities Tailwind evita duplicação e aproveita o purging automático de classes não usadas. SCSS fica reservado apenas para animações ou pseudo-seletores que o Tailwind não cobre bem.

## Arquitetura e decisões

### Decisão 1 — Paleta primária unificada

A escala usada no PrimeNG preset (`app.config.ts`) já é a correta:

| Token Tailwind | Hex | CSS var equivalente |
|---|---|---|
| `primary-50` | `#eff6ff` | — |
| `primary-100` | `#dbeafe` | `--primary-light` |
| `primary-500` | `#3b82f6` | — |
| `primary-600` | `#2563eb` | `--primary-color` |
| `primary-700` | `#1d4ed8` | `--primary-hover` |
| `primary-800` | `#1e40af` | `--primary-active` |

**DEFAULT** do Tailwind apontará para `primary-600` (`#2563EB`), sincronizado com `--primary-color`.

### Decisão 2 — Tipografia

`styles.css` define `font-family: 'Inter', sans-serif` no body. O `tailwind.config.js` usa `Manrope` — isso será corrigido para `Inter`. A fonte Inter já é carregada via Google Fonts no `index.html` (verificar e adicionar se ausente).

### Decisão 3 — Amber semântico vs. amber de destaque

| Uso | Ação |
|---|---|
| Badge de status "Ag. peça" (`landing.component.html:135`) | **Manter** — é semântico de status |
| Ícone de feature na landing (`landing.component.html:220-221`) | **Substituir** por `blue-500/20` + `blue-200` |
| Valor de "trial tenants" no admin-dashboard | **Substituir** por `text-primary` ou `text-blue-600` |

### Decisão 4 — Surface / Background tokens no Tailwind

Adicionar ao `tailwind.config.js` os tokens de superfície alinhados com `styles.css`:

```js
surface: {
  DEFAULT: 'var(--bg-card)',
  light:   'var(--bg-light)',
  border:  'var(--border-color)',
},
text: {
  DEFAULT:   'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  inverse:   'var(--text-inverse)',
},
```

Isso permite usar `bg-surface`, `text-secondary` etc. como classes Tailwind nos templates, sem depender de classes CSS globais.

## Mudanças por camada

### Web (Angular / Tailwind / PrimeNG)

**`tailwind.config.js`**
- Trocar paleta `primary` de laranja para escala de azul (alinhada com `app.config.ts`)
- Trocar fonte de `Manrope` para `Inter, system-ui, sans-serif`
- Adicionar aliases de surface e text para consumo nos templates
- Manter paletas semânticas: `success` (verde), `warning` (âmbar — usado em status), `danger` (vermelho)

**`apps/web/src/app/features/landing/landing.component.html`**
- Linha 220-221: trocar `bg-amber-500/30` → `bg-blue-500/20`, `text-amber-200` → `text-blue-200`
- Linha 135: **não alterar** (badge de status semântico)

**`apps/web/src/app/features/admin/components/admin-dashboard/admin-dashboard.component.ts`**
- Linha 35: trocar `text-amber-500` → `text-blue-600` (ou `text-[var(--primary-color)]`)

**`index.html` (ou `_document.html`)**
- Verificar se Google Fonts carrega `Inter`. Se não, adicionar:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  ```

### API (NestJS/TypeORM)
- Nenhuma mudança.

### Banco (Postgres/Supabase/RLS)
- Nenhuma mudança.

### Shared (`libs/shared-types`, etc.)
- Nenhuma mudança.

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Classes Tailwind `primary-*` usadas em templates com a cor antiga | Média | Grep por `text-primary-`, `bg-primary-`, `border-primary-` antes de mergear |
| Modo escuro quebrar depois da mudança de paleta | Baixa | Testar em `html.dark` após cada arquivo alterado |
| Inter não carregada — fallback feio | Baixa | Garantir `<link>` no index.html antes de qualquer deploy |
| Componentes PrimeNG com cor hardcoded via `styleClass` | Baixa | Grep por `styleClass="*orange*"` e `styleClass="*amber*"` |

## Estratégia de validação por AC

| AC | Como verificar |
|---|---|
| AC01 | Abrir `tailwind.config.js` e confirmar `primary.DEFAULT = #2563EB` |
| AC02 | DevTools → Inspecionar botão "Nova OS" → `background-color` deve ser azul |
| AC03 | DevTools → `body` computed style → `font-family` começa com `Inter` |
| AC04 | Acessar `/admin/dashboard` → valor de trial deve ser azul, não laranja |
| AC05 | Inspeção visual em `/app/dashboard`, `/app/os`, `/app/clientes`, `/admin/dashboard` |
| AC06 | Adicionar `dark` à tag `html` → layout escuro exibido sem cores laranja |

## Ordem de execução recomendada

```
1. Corrigir tailwind.config.js (primary + fonte)           → TSK001
2. Verificar e corrigir index.html (Inter font link)        → TSK002
3. Corrigir landing.component.html (2 linhas amber)         → TSK003
4. Corrigir admin-dashboard.component.ts (1 linha amber)    → TSK004
5. Grep de segurança por primary-* / orange / amber restantes → TSK005
6. Inspeção visual manual nas 5 rotas + dark mode           → TSK006
```
