import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

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
        path: 'logs',
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
