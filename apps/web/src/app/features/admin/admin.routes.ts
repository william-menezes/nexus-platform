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
  {
    path: 'planos',
    loadComponent: () =>
      import('./components/plan-list/plan-list.component').then(
        m => m.PlanListComponent,
      ),
  },
  {
    path: 'planos/novo',
    loadComponent: () =>
      import('./components/plan-form/plan-form.component').then(
        m => m.PlanFormComponent,
      ),
  },
  {
    path: 'planos/:id',
    loadComponent: () =>
      import('./components/plan-form/plan-form.component').then(
        m => m.PlanFormComponent,
      ),
  },
  {
    path: 'cupons',
    loadComponent: () =>
      import('./components/coupon-list/coupon-list.component').then(
        m => m.CouponListComponent,
      ),
  },
  {
    path: 'cupons/novo',
    loadComponent: () =>
      import('./components/coupon-form/coupon-form.component').then(
        m => m.CouponFormComponent,
      ),
  },
  {
    path: 'cupons/:id',
    loadComponent: () =>
      import('./components/coupon-form/coupon-form.component').then(
        m => m.CouponFormComponent,
      ),
  },
];
