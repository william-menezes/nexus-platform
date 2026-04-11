import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/return-list/return-list.component').then(
        m => m.ReturnListComponent,
      ),
  },
  {
    path: 'nova',
    loadComponent: () =>
      import('./components/return-form/return-form.component').then(
        m => m.ReturnFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/return-detail/return-detail.component').then(
        m => m.ReturnDetailComponent,
      ),
  },
];
