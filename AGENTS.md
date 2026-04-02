# Nexus Platform - Agent Instructions (Repo-Wide)

These instructions apply to the whole repository.

## Design System ("nexus-clean")
- For any UI work (building, styling, reviewing) in `apps/web/` or `libs/ui-components/`, follow the Nexus Clean design system defined in `.claude/skills/clean/SKILL.md`.
- If the skill conflicts with the actual codebase, prefer the codebase reality:
  - Angular 21, standalone components (no NgModules)
  - PrimeNG 21 + Tailwind CSS
  - Existing tokens/utilities in `tailwind.config.js` and `apps/web/src/styles.css`
  - Font in the app is Manrope (see `apps/web/src/index.html` and CSS)

## Angular conventions
- Standalone components only (`standalone: true`).
- Use Angular control flow blocks (`@if`, `@for`, `@switch`) instead of `*ngIf`/`*ngFor`.
- Prefer `signal()`, `computed()` for UI state.

## PrimeNG conventions (important)
- When a template uses PrimeNG components (e.g. `p-button`, `p-table`, `p-tag`, `p-toast`, `p-confirmDialog`, `p-message`), the owning standalone component must import the corresponding PrimeNG module in `@Component({ imports: [...] })`.
- When a template uses common pipes (e.g. `slice`), the owning standalone component must import the pipe (e.g. `SlicePipe`) via `@angular/common`.
- Do not "fix" unknown element errors by adding `CUSTOM_ELEMENTS_SCHEMA` / `NO_ERRORS_SCHEMA`.

## Shared packages
- Shared types live in `@nexus-platform/shared-types` (do not invent `@nexus/...` aliases unless the repo already defines them).
- Shared utilities live in the existing shared libs (follow current imports in the repo).

## Styling pipeline
- Tailwind utilities are expected to be enabled in `apps/web/src/styles.css` (via `@tailwind ...` directives).
- PrimeIcons must render in production builds; if icons show as squares, ensure fonts are being served (see `apps/web/project.json` assets and `apps/web/src/styles.css`).

