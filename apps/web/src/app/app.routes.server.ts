import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rotas dinâmicas (com parâmetros) — renderizadas no servidor a cada request
  { path: 'app/os/:id',                renderMode: RenderMode.Server },
  { path: 'app/os/:id/editar',         renderMode: RenderMode.Server },
  { path: 'app/estoque/:id/editar',    renderMode: RenderMode.Server },
  // Rotas autenticadas — renderizadas no servidor (dependem de sessão do usuário)
  { path: 'app/dashboard',             renderMode: RenderMode.Server },
  { path: 'app/os',                    renderMode: RenderMode.Server },
  { path: 'app/os/nova',               renderMode: RenderMode.Server },
  { path: 'app/estoque',               renderMode: RenderMode.Server },
  { path: 'app/estoque/novo',          renderMode: RenderMode.Server },
  { path: 'app/estoque/nfe-import',    renderMode: RenderMode.Server },
  { path: 'app/financeiro',            renderMode: RenderMode.Server },
  { path: 'app/financeiro/vendas',     renderMode: RenderMode.Server },
  { path: 'app/financeiro/pdv',        renderMode: RenderMode.Server },
  { path: 'app/financeiro/dre',        renderMode: RenderMode.Server },
  // Rotas estáticas — pré-renderizadas em build time
  { path: '**',                        renderMode: RenderMode.Prerender },
];
