import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/quote-list/quote-list.component').then(m => m.QuoteListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/quote-form/quote-form.component').then(m => m.QuoteFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/quote-detail/quote-detail.component').then(m => m.QuoteDetailComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/quote-form/quote-form.component').then(m => m.QuoteFormComponent),
  },
];
