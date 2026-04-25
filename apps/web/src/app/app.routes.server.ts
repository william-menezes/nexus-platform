import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rotas públicas estáticas — pré-renderizadas em build time
  { path: '',              renderMode: RenderMode.Prerender },
  { path: 'login',         renderMode: RenderMode.Prerender },
  { path: 'cadastro',      renderMode: RenderMode.Prerender },
  { path: 'esqueci-senha', renderMode: RenderMode.Prerender },

  // Auth callback e setup de empresa — requerem sessão/tokens da URL, só cliente
  { path: 'auth/callback',    renderMode: RenderMode.Client },
  { path: 'cadastro/empresa', renderMode: RenderMode.Client },

  // Rotas autenticadas — renderizadas no cliente (requerem sessão, sem SSR)
  { path: 'app/**',   renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Fallback
  { path: '**', renderMode: RenderMode.Prerender },
];
