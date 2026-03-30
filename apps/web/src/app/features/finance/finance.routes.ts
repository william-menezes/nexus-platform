import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vendas',
    pathMatch: 'full',
  },
  {
    path: 'vendas',
    loadComponent: () =>
      import('./components/sales-list/sales-list.component').then(m => m.SalesListComponent),
  },
  {
    path: 'pdv',
    loadComponent: () =>
      import('./components/pdv/pdv.component').then(m => m.PdvComponent),
  },
  {
    path: 'dre',
    loadComponent: () =>
      import('./components/dre/dre.component').then(m => m.DreComponent),
  },
];
