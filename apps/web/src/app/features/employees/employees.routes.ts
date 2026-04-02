import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
  },
];
