import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/contract-list/contract-list.component').then(
        m => m.ContractListComponent,
      ),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/contract-form/contract-form.component').then(
        m => m.ContractFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/contract-detail/contract-detail.component').then(
        m => m.ContractDetailComponent,
      ),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/contract-form/contract-form.component').then(
        m => m.ContractFormComponent,
      ),
  },
];
