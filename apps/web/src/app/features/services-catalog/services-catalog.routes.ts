import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/service-list/service-list.component').then(m => m.ServiceListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent),
  },
];
