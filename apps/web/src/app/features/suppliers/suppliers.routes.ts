import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/supplier-list/supplier-list.component').then(m => m.SupplierListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
  },
];
