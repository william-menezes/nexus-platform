import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ButtonModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  private readonly user = toSignal(this.auth.user$);
  sidebarOpen = signal(true);

  readonly nav: NavItem[] = [
    { label: 'Dashboard',        icon: 'pi pi-home',       route: '/app/dashboard' },
    { label: 'Clientes',         icon: 'pi pi-users',      route: '/app/clientes' },
    { label: 'Ordens de Serviço', icon: 'pi pi-wrench',    route: '/app/os' },
    { label: 'Estoque',          icon: 'pi pi-box',        route: '/app/estoque' },
    { label: 'Financeiro',       icon: 'pi pi-chart-bar',  route: '/app/financeiro' },
  ];

  get userEmail() {
    return this.user()?.email ?? '';
  }

  get userInitial() {
    return this.userEmail.charAt(0).toUpperCase();
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }
}
