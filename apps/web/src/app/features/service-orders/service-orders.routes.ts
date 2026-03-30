import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/os-list/os-list.component').then(m => m.OsListComponent),
  },
  {
    path: 'nova',
    loadComponent: () =>
      import('./components/os-form/os-form.component').then(m => m.OsFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/os-detail/os-detail.component').then(m => m.OsDetailComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/os-form/os-form.component').then(m => m.OsFormComponent),
  },
];
