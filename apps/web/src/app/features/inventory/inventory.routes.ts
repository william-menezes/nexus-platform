import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/product-list/product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/product-form/product-form.component').then(m => m.ProductFormComponent),
  },
  {
    path: 'nfe-import',
    loadComponent: () =>
      import('./components/nfe-import/nfe-import.component').then(m => m.NfeImportComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/product-form/product-form.component').then(m => m.ProductFormComponent),
  },
];
