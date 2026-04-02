import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/entry-list/entry-list.component').then(m => m.EntryListComponent),
  },
  {
    path: 'lancamentos/novo',
    loadComponent: () =>
      import('./components/entry-form/entry-form.component').then(m => m.EntryFormComponent),
  },
  {
    path: 'lancamentos/:id',
    loadComponent: () =>
      import('./components/entry-detail/entry-detail.component').then(m => m.EntryDetailComponent),
  },
  {
    path: 'caixa',
    loadComponent: () =>
      import('./components/cash-session/cash-session.component').then(m => m.CashSessionComponent),
  },
  {
    path: 'plano-de-contas',
    loadComponent: () =>
      import('./components/chart-of-accounts/chart-of-accounts.component').then(m => m.ChartOfAccountsComponent),
  },
];
