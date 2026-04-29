# Plano — Correção de Dark Mode, Contraste de Botão e Headers de Página

Referência: `spec.md`

## Abordagem

Três frentes independentes, todas puramente frontend (CSS + HTML). Sem mudanças em API ou banco.

---

## 1. Dark Mode — Tokens PrimeNG

### Diagnóstico detalhado

O `styles.css` atual sobrescreve os tokens `--p-surface-*` apenas em `:root`:

```css
/* styles.css :root */
--p-surface-ground:  var(--bg-light);   /* #F8FAFC */
--p-surface-card:    var(--bg-card);    /* #FFFFFF */
--p-surface-border:  var(--border-color);
```

Quando `html.dark` é ativado, o PrimeNG Aura redefine esses tokens para seus valores padrão (muito escuros, quase preto). Como `html.dark` tem maior especificidade que `:root` para os tokens do PrimeNG, o preset vence.

### Solução

Adicionar ao bloco `html.dark` em `styles.css` os overrides dos tokens `--p-surface-*` e demais tokens internos do PrimeNG que controlam fundos de componentes:

```css
html.dark {
  /* … tokens existentes … */

  /* PrimeNG surface tokens — forçar paleta Slate */
  --p-surface-0:       #FFFFFF;
  --p-surface-50:      #F8FAFC;
  --p-surface-100:     #F1F5F9;
  --p-surface-200:     #E2E8F0;
  --p-surface-300:     #CBD5E1;
  --p-surface-400:     #94A3B8;
  --p-surface-500:     #64748B;
  --p-surface-600:     #475569;
  --p-surface-700:     #334155;
  --p-surface-800:     #1E293B;
  --p-surface-900:     #0F172A;
  --p-surface-950:     #020617;

  /* PrimeNG component-specific */
  --p-surface-ground:   #0F172A;    /* fundo da página */
  --p-surface-section:  #0F172A;
  --p-surface-card:     #1E293B;    /* fundo de p-card */
  --p-surface-overlay:  #1E293B;    /* dialogs, overlays */
  --p-surface-border:   #334155;
  --p-surface-hover:    rgba(37, 99, 235, 0.15);

  --p-content-background: #1E293B;
  --p-content-border-color: #334155;
  --p-content-color: #F1F5F9;
  --p-content-hover-background: rgba(37, 99, 235, 0.15);

  /* Table */
  --p-datatable-header-background: #0F172A;
  --p-datatable-body-row-background: #1E293B;
  --p-datatable-row-toggle-button-hover-background: rgba(37,99,235,0.15);

  /* Input */
  --p-inputtext-background: #1E293B;
  --p-inputtext-border-color: #334155;
  --p-inputtext-color: #F1F5F9;
  --p-inputtext-placeholder-color: #64748B;

  /* Select / Dropdown */
  --p-select-background: #1E293B;
  --p-select-border-color: #334155;
  --p-select-overlay-background: #1E293B;

  /* Card */
  --p-card-background: #1E293B;
  --p-card-color: #F1F5F9;
  --p-card-border-color: #334155;
}
```

**Nota sobre `p-breadcrumb`:** já usa `background: transparent` via `.nx-breadcrumb.p-breadcrumb` no CSS — basta garantir que o token `--p-breadcrumb-background` não sobrescreva isso. Adicionar:
```css
html.dark {
  --p-breadcrumb-background: transparent;
}
```

---

## 2. Contraste do Botão Primário

### Diagnóstico

O `.p-button:not(.p-button-text):not(...)` no `styles.css` define `background` e `border-color`, mas não define `color`. O PrimeNG Aura usa `--p-button-primary-color` (mapeado de `{primary.contrastColor}`) para o texto. No preset customizado atual (`definePreset(Aura, { semantic: { primary: {...} } })`), o `contrastColor` não é definido explicitamente, então o Aura calcula automaticamente baseado no luminance — o que pode resultar em preto dependendo da versão.

### Solução A — CSS global (mais simples, menos frágil)

```css
/* styles.css — seção 4. PRIMENG: BUTTONS */
.p-button:not(.p-button-text):not(.p-button-outlined):not(.p-button-link) {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #FFFFFF;  /* ADICIONAR */
}
```

### Solução B — Preset Aura (mais correto)

No `app.config.ts`, adicionar `contrastColor` ao preset:

```typescript
const NexusPreset = definePreset(Aura, {
  semantic: {
    primary: {
      /* … cores existentes … */
      contrastColor: '#FFFFFF',
    },
  },
});
```

**Decisão:** usar as **duas** — Solução A como garantia imediata via CSS, Solução B como correção correta no preset.

---

## 3. Headers de Página

### Diagnóstico

Há três padrões inconsistentes nos componentes:

| Padrão | Exemplo | Problema |
|---|---|---|
| `<h1 class="text-2xl font-bold">` | purchase-order-list | Sem subtitle; peso depende do Tailwind |
| `<h1 class="text-2xl font-bold text-text">` | alguns forms | Sem subtitle; token correto, mas classe inline |
| `<h1 class="nx-page-title">` | raramente usado | Correto — mas poucos usam |

### Solução

Padronizar **todos** os `<h1>` das telas de feature para:

```html
<div class="nx-page-header">
  <div>
    <h1 class="nx-page-title">Título da Tela</h1>
    <p class="nx-page-subtitle">Subtítulo descritivo curto (1 linha)</p>
  </div>
  <!-- botão de ação, se houver -->
  <a routerLink="novo" pButton ...></a>
</div>
```

Classes já definidas em `styles.css`:
- `.nx-page-header` — flex row, `justify-between`, `align-items: flex-start`, `mb: 1.5rem`
- `.nx-page-title` — `font-size: 1.625rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary)`
- `.nx-page-subtitle` — `font-size: 0.875rem; color: var(--text-secondary)`

**Subtítulos sugeridos por tela:**

| Tela | Subtítulo |
|---|---|
| Clientes | Gerencie os clientes do seu negócio |
| Orçamentos | Crie e acompanhe orçamentos para seus clientes |
| Ordens de Serviço | Acompanhe as ordens de serviço em andamento |
| Vendas | Histórico e gestão de vendas |
| PDV | Ponto de Venda — registre vendas rapidamente |
| Estoque / Produtos | Controle o estoque de produtos |
| Pedidos de Compra | Gerencie pedidos de compra a fornecedores |
| Financeiro / Lançamentos | Contas a pagar e a receber |
| DRE | Demonstrativo de Resultado do Exercício |
| Contratos | Contratos e mensalidades de clientes |
| Funcionários | Gestão de funcionários e técnicos |
| Fornecedores | Cadastro de fornecedores |
| Serviços | Catálogo de serviços oferecidos |
| Equipamentos | Equipamentos cadastrados |
| Devoluções | Solicitações de devolução e troca |
| Configurações | Personalize as configurações do sistema |
| Plano de Contas | Estrutura contábil da empresa |
| Logs de Auditoria | Histórico de ações do sistema |
| Clientes (detalhe) | `{{ client.name }}` |
| OS (detalhe) | `{{ os.code }}` — `{{ os.status }}` |
| Pedido de compra (detalhe) | `{{ po.code }}` — `{{ po.supplier?.name }}` |

---

## Arquitetura e decisões

- **Somente CSS e HTML** — zero mudanças em TypeScript de lógica ou services
- **`app.config.ts`** recebe apenas adição de `contrastColor` no preset
- **`styles.css`** recebe os blocos de tokens dark mode e a correção de cor do botão
- **HTML das features** recebe substituição de `<h1 class="text-2xl font-bold ...">` → `class="nx-page-title"` e adição do `<p class="nx-page-subtitle">`

## Mudanças por camada

- **Web (Angular/PrimeNG/Tailwind):**
  - `apps/web/src/styles.css` — bloco `html.dark` expandido + botão fixado
  - `apps/web/src/app/app.config.ts` — `contrastColor: '#FFFFFF'` no NexusPreset
  - `apps/web/src/app/features/**/*.component.html` — headers padronizados (~40 arquivos)
- **API (NestJS/TypeORM):** sem mudanças
- **Banco (Postgres/Supabase/RLS):** sem mudanças
- **Shared (`libs/shared-types`, etc.):** sem mudanças

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Tokens `--p-datatable-*` não existem no Aura 21 | Média | Usar inspeção DevTools para confirmar token names; fallback via seletor CSS |
| Override de token rompe componente em light mode | Baixa | Tokens apenas em `html.dark` block — isolados |
| Subtítulos muito genéricos prejudicam UX | Baixa | Subtítulos validados com usuário antes do merge |
| Build quebrar por erro de HTML | Muito baixa | `nx build web` como gate antes do commit |

## Estratégia de validação

- **AC01–AC04** (dark mode): Ativar dark mode → DevTools Computed → verificar `background-color` de cada componente
- **AC05–AC06** (contraste botão): DevTools > Accessibility > Contrast ratio em botão primário
- **AC07** (headers): `grep -r "text-2xl font-bold" apps/web/src/app/features --include="*.html"` → zero resultados após migração
- **AC08** (build): `npx nx build web` → sucesso
