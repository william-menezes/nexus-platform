---
name: nexus-clean
description: Design system for the Nexus Service Platform — an Angular 20 multi-tenant ERP for repair shops. Use this skill whenever building, styling, or reviewing UI components in the Nexus project, including dashboard views, service order screens, inventory tables, finance modules, authentication flows, settings pages, or any Angular standalone component in `libs/ui-components/` or `apps/web/`. Also trigger when the user asks about Tailwind utility choices, responsive layout, color tokens, spacing, typography, or accessibility for this project.
license: MIT
metadata:
  author: William (adapted from typeui.sh Clean)
---

# Nexus Clean — Design System Skill

## Mission
Generate production-ready Angular 20 standalone components styled with Tailwind CSS that follow a clean, minimal design language optimized for repair-shop ERP workflows (technicians, counter staff, shop owners).

## Project Context

### Stack
- **Framework:** Angular 20 with SSR (standalone components, no NgModules)
- **Styling:** Tailwind CSS (utility-first)
- **Monorepo:** Nx workspace
- **UI library location:** `libs/ui-components/src/lib/`
- **Feature components:** `apps/web/src/app/features/<domain>/`
- **Shared types:** `libs/shared-types/src/lib/`

### Architecture Rules
- All components must be **standalone** (`standalone: true`) — never create NgModules
- Use `loadComponent` / `loadChildren` for lazy loading in routes
- Shared/reusable components go in `libs/ui-components/`
- Feature-specific components stay in `apps/web/src/app/features/`
- Import shared types from `@nexus/shared-types`
- Import shared utilities from `@nexus/shared-utils`

### Domain Context
This is a **multi-tenant SaaS ERP** for technical assistance and repair shops. Key user personas:
- **Shop Owner:** dashboards, finance reports, pricing strategy
- **Technician:** service orders, parts lookup, status updates
- **Counter Staff:** intake forms, customer search, quick quotes

Design must be efficient for high-volume daily use — minimal clicks, scannable tables, fast data entry.

---

## Style Foundations

### Typography
| Token        | Size | Weight | Tailwind Class         | Usage                        |
|-------------|------|--------|------------------------|------------------------------|
| `text-xs`   | 12px | 400    | `text-xs`              | Captions, badges, metadata   |
| `text-sm`   | 14px | 400    | `text-sm`              | Secondary text, table cells  |
| `text-base` | 16px | 400    | `text-base`            | Body text, form inputs       |
| `text-lg`   | 20px | 500    | `text-lg font-medium`  | Section headings             |
| `text-xl`   | 24px | 600    | `text-xl font-semibold`| Page titles                  |
| `text-2xl`  | 32px | 700    | `text-2xl font-bold`   | Dashboard metrics, hero text |

**Font stack (set in `tailwind.config.js`):**
```js
fontFamily: {
  sans: ['Roboto', 'system-ui', 'sans-serif'],       // primary body
  display: ['Poppins', 'system-ui', 'sans-serif'],   // headings, dashboard
  mono: ['Inconsolata', 'monospace'],                 // codes, OS numbers
}
```

Use `font-display` for page titles, dashboard KPIs, and headings. Use `font-mono` for service order codes (`OS-2026-001`), serial numbers, and currency values in tables.

### Color Tokens
Define in `tailwind.config.js` under `theme.extend.colors`:

```js
colors: {
  primary:   { DEFAULT: '#3B82F6', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
  secondary: { DEFAULT: '#8B5CF6', 50: '#F5F3FF', 500: '#8B5CF6', 600: '#7C3AED' },
  success:   { DEFAULT: '#16A34A', 50: '#F0FDF4', 500: '#16A34A', 600: '#15803D' },
  warning:   { DEFAULT: '#D97706', 50: '#FFFBEB', 500: '#D97706', 600: '#B45309' },
  danger:    { DEFAULT: '#DC2626', 50: '#FEF2F2', 500: '#DC2626', 600: '#B91C1C' },
  surface:   { DEFAULT: '#FFFFFF', muted: '#F9FAFB', border: '#E5E7EB' },
  text:      { DEFAULT: '#111827', secondary: '#6B7280', muted: '#9CA3AF' },
}
```

**Service order status mapping** (use consistently across all views):
| Status           | Color Token   | Badge Classes                                      |
|-----------------|---------------|----------------------------------------------------|
| `open`          | `primary`     | `bg-primary-50 text-primary-700`                   |
| `in_progress`   | `warning`     | `bg-warning-50 text-warning-700`                   |
| `awaiting_parts`| `secondary`   | `bg-secondary-50 text-secondary-700`               |
| `done`          | `success`     | `bg-success-50 text-success-700`                   |
| `cancelled`     | `danger`      | `bg-danger-50 text-danger-700`                     |

### Spacing
Follow an **8px baseline grid** using Tailwind's default scale:
- `gap-1` (4px) — only for inline icon+text
- `gap-2` (8px) — between related elements (label + input)
- `gap-3` (12px) — between form fields
- `gap-4` (16px) — between card sections
- `gap-6` (24px) — between page sections
- `gap-8` (32px) — major layout divisions

Page padding: `px-4 md:px-6 lg:px-8`. Card padding: `p-4 md:p-6`.

---

## Component Patterns

### General Rules
- Every component must handle **empty**, **loading**, and **error** states
- Use Angular signals (`signal()`, `computed()`) for reactive state — avoid RxJS for simple UI state
- Use `@if`, `@for`, `@switch` control flow (Angular 20 syntax) — never `*ngIf`, `*ngFor`
- Prefer `input()` / `output()` signal-based APIs over `@Input()` / `@Output()` decorators
- All interactive elements must have visible `focus-visible` states

### Buttons
```html
<!-- Primary -->
<button class="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white
  hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Save
</button>

<!-- Secondary (outline) -->
<button class="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-text
  hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Cancel
</button>

<!-- Danger -->
<button class="... bg-danger-500 hover:bg-danger-600 focus-visible:ring-danger-500 ...">
  Delete
</button>
```
Touch target: minimum `py-2.5 px-4` (44px+ height).

### Form Inputs
```html
<label class="block text-sm font-medium text-text mb-1.5" for="clientName">
  Client Name
</label>
<input id="clientName"
  class="block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-base text-text placeholder:text-text-muted
    focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none
    disabled:bg-surface-muted disabled:cursor-not-allowed transition-colors"
  placeholder="Enter client name" />
<!-- Error state: add border-danger-500 focus:ring-danger-500 + error message below -->
<p class="mt-1 text-sm text-danger-500">Client name is required</p>
```

### Data Tables (Service Orders, Inventory)
Tables are a primary interaction surface in this ERP. Prioritize:
- Fixed header with `sticky top-0`
- Sortable columns with clear indicators
- Row hover: `hover:bg-surface-muted`
- Status badges inline (use the status mapping above)
- Actions column with icon buttons (edit, view, delete)
- Responsive: on mobile, switch to card-based list layout using `@if` on a breakpoint signal

### Cards
```html
<div class="rounded-xl border border-surface-border bg-white p-4 md:p-6 shadow-sm">
  <!-- Card content -->
</div>
```

### Dashboard KPI Cards
```html
<div class="rounded-xl border border-surface-border bg-white p-6">
  <p class="text-sm text-text-secondary">Open Service Orders</p>
  <p class="mt-1 font-display text-2xl font-bold text-text">42</p>
  <p class="mt-1 text-xs text-success-500">↑ 12% from last week</p>
</div>
```

### Empty States
Every list/table must include an empty state:
```html
<div class="flex flex-col items-center justify-center py-16 text-center">
  <!-- Icon here (use a relevant SVG, 48x48, text-text-muted) -->
  <p class="mt-4 text-base font-medium text-text">No service orders yet</p>
  <p class="mt-1 text-sm text-text-secondary">Create your first service order to get started.</p>
  <button class="mt-4 ...primary button classes...">+ New Service Order</button>
</div>
```

### Loading Skeletons
Use `animate-pulse` with `bg-surface-muted rounded` blocks matching the expected content layout. Never show a blank screen.

---

## Layout

### App Shell
```
┌─────────────────────────────────────────┐
│  Top Bar (h-16, logo + tenant name +    │
│           user menu)                     │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Main Content Area           │
│ (w-64,   │  (px-6 py-6, max-w-7xl)     │
│ collaps- │                              │
│ ible to  │                              │
│ w-16)    │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

- Sidebar: collapsible on desktop, drawer overlay on mobile (`lg:` breakpoint)
- Top bar: always visible, `sticky top-0 z-30`
- Main content: scrollable, `overflow-y-auto`
- Navigation groups: Dashboard, Service Orders, Inventory, Finance, Settings

### Responsive Breakpoints
Follow Tailwind defaults: `sm:640`, `md:768`, `lg:1024`, `xl:1280`. Design mobile-first. Key adaptations:
- Tables → card lists below `md:`
- Sidebar → hidden + hamburger below `lg:`
- Form layouts → single column below `md:`, two-column at `md:`+

---

## Accessibility

### Requirements (WCAG 2.2 AA)
- Color contrast: minimum 4.5:1 for text, 3:1 for large text and UI elements
- All form inputs must have associated `<label>` elements (use `for`/`id` pairing)
- Keyboard navigation: all interactive elements reachable via Tab, operable via Enter/Space
- Focus states: always use `focus-visible:ring-2` (never remove outlines)
- Touch targets: minimum 44×44px
- `prefers-reduced-motion`: disable transitions/animations with `motion-reduce:transition-none`
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<table>`) before reaching for ARIA
- Screen-reader labels on icon-only buttons: `aria-label="Edit service order"`

### Testing Checklist
- [ ] Tab through entire page — all interactive elements reachable
- [ ] All form errors announced to screen readers (`aria-describedby` + `role="alert"`)
- [ ] Color is never the only indicator (icons/text accompany status badges)
- [ ] Works with browser zoom at 200%

---

## Writing Tone
- **Clear and friendly** — this is a work tool, not a marketing site
- Labels: short, verb-first for actions ("Create Order", "Add Part"), noun for navigation ("Service Orders", "Inventory")
- Error messages: say what happened + what to do ("Phone number must have 10-11 digits")
- Empty states: encouraging, with a clear CTA
- Never use technical jargon in user-facing text (no "tenant", "RLS", "UUID")

---

## Anti-Patterns — Do NOT

- Use `NgModule` or `CommonModule` — standalone components only
- Use `*ngIf` / `*ngFor` — use `@if` / `@for` block syntax
- Use `@Input()` / `@Output()` decorators — use signal-based `input()` / `output()`
- Apply raw hex colors — always use Tailwind tokens (`text-primary-500`, not `text-[#3B82F6]`)
- Create components without empty/loading/error states
- Use `outline-none` without a visible `focus-visible` ring replacement
- Place shared components inside `apps/web/` — they belong in `libs/ui-components/`
- Use inconsistent status colors — follow the status mapping table above
- Create modals wider than `max-w-lg` for forms, `max-w-2xl` for detail views
- Skip `aria-label` on icon-only buttons

---

## QA Checklist (for every component PR)
- [ ] Component is standalone with no NgModule
- [ ] Uses `@if`/`@for` control flow, not structural directives
- [ ] All colors reference Tailwind tokens, no raw values
- [ ] Empty, loading, and error states implemented
- [ ] Keyboard accessible (Tab + Enter/Space)
- [ ] `focus-visible` ring on all interactive elements
- [ ] Touch targets ≥ 44px
- [ ] Labels on all form fields
- [ ] `aria-label` on all icon-only buttons
- [ ] Responsive at `sm`, `md`, `lg` breakpoints
- [ ] Status badges use the standard color mapping
- [ ] Follows 8px spacing grid
