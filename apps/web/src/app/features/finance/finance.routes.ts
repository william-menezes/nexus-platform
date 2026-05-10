import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vendas',
    pathMatch: 'full',
  },
  {
    path: 'vendas',
    loadComponent: () =>
      import('./components/sales-list/sales-list.component').then(m => m.SalesListComponent),
  },
  {
    path: 'pdv',
    loadComponent: () =>
      import('./components/pdv/pdv.component').then(m => m.PdvComponent),
  },
  {
    path: 'dre',
    loadComponent: () =>
      import('./components/dre/dre.component').then(m => m.DreComponent),
  },
  {
    path: 'relatorios/por-produto',
    loadComponent: () =>
      import('./components/sales-by-product/sales-by-product.component').then(m => m.SalesByProductComponent),
  },
  {
    path: 'relatorios/por-funcionario',
    loadComponent: () =>
      import('./components/sales-by-employee/sales-by-employee.component').then(m => m.SalesByEmployeeComponent),
  },
  {
    path: 'relatorios/por-pagamento',
    loadComponent: () =>
      import('./components/sales-by-payment/sales-by-payment.component').then(m => m.SalesByPaymentComponent),
  },
];
