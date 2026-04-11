import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        m => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'tenants',
    loadComponent: () =>
      import('./components/tenant-list/tenant-list.component').then(
        m => m.TenantListComponent,
      ),
  },
  {
    path: 'tenants/:id',
    loadComponent: () =>
      import('./components/tenant-detail/tenant-detail.component').then(
        m => m.TenantDetailComponent,
      ),
  },
];
