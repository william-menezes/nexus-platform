import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clients/clients.routes').then(m => m.routes),
      },
      {
        path: 'os',
        loadChildren: () =>
          import('./features/service-orders/service-orders.routes').then(m => m.routes),
      },
      {
        path: 'estoque',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then(m => m.routes),
      },
      {
        path: 'vendas',
        loadChildren: () =>
          import('./features/finance/finance.routes').then(m => m.routes),
      },
      {
        path: 'funcionarios',
        loadChildren: () =>
          import('./features/employees/employees.routes').then(m => m.routes),
      },
      {
        path: 'servicos',
        loadChildren: () =>
          import('./features/services-catalog/services-catalog.routes').then(m => m.routes),
      },
      {
        path: 'equipamentos',
        loadChildren: () =>
          import('./features/equipments/equipments.routes').then(m => m.routes),
      },
      {
        path: 'orcamentos',
        loadChildren: () =>
          import('./features/quotes/quotes.routes').then(m => m.routes),
      },
      {
        path: 'financeiro',
        loadChildren: () =>
          import('./features/financial/financial.routes').then(m => m.routes),
      },
      {
        path: 'fornecedores',
        loadChildren: () =>
          import('./features/suppliers/suppliers.routes').then(m => m.routes),
      },
      {
        path: 'configuracoes',
        loadChildren: () =>
          import('./features/settings/settings.routes').then(m => m.routes),
      },
      {
        path: 'compras',
        loadChildren: () =>
          import('./features/purchase-orders/purchase-orders.routes').then(m => m.routes),
      },
      {
        path: 'contratos',
        loadChildren: () =>
          import('./features/contracts/contracts.routes').then(m => m.routes),
      },
      {
        path: 'devolucoes',
        loadChildren: () =>
          import('./features/returns/returns.routes').then(m => m.routes),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layout/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/components/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/admin/components/tenant-list/tenant-list.component').then(
            m => m.TenantListComponent,
          ),
      },
      {
        path: 'tenants/:id',
        loadComponent: () =>
          import('./features/admin/components/tenant-detail/tenant-detail.component').then(
            m => m.TenantDetailComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
