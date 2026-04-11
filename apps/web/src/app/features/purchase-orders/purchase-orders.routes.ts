import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/purchase-order-list/purchase-order-list.component').then(
        m => m.PurchaseOrderListComponent,
      ),
  },
  {
    path: 'nova',
    loadComponent: () =>
      import('./components/purchase-order-form/purchase-order-form.component').then(
        m => m.PurchaseOrderFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/purchase-order-detail/purchase-order-detail.component').then(
        m => m.PurchaseOrderDetailComponent,
      ),
  },
];
