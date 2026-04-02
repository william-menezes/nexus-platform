import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rotas públicas estáticas — pré-renderizadas em build time
  { path: '',        renderMode: RenderMode.Prerender },
  { path: 'login',   renderMode: RenderMode.Prerender },
  { path: 'cadastro', renderMode: RenderMode.Prerender },

  // Rotas autenticadas — renderizadas no cliente (requerem sessão, sem SSR)
  { path: 'app/**',  renderMode: RenderMode.Client },

  // Fallback
  { path: '**',      renderMode: RenderMode.Prerender },
];
