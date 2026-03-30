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
        path: 'financeiro',
        loadChildren: () =>
          import('./features/finance/finance.routes').then(m => m.routes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
