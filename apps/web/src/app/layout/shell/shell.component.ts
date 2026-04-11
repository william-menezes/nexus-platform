import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
}

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  private readonly user = toSignal(this.auth.user$);
  sidebarOpen = signal(true);

  readonly nav: NavItem[] = [
    { label: 'Dashboard',         icon: 'pi pi-home',          route: '/app/dashboard' },
    { label: 'Clientes',          icon: 'pi pi-users',         route: '/app/clientes' },
    { label: 'Orçamentos',        icon: 'pi pi-file-edit',     route: '/app/orcamentos' },
    { label: 'Ordens de Serviço', icon: 'pi pi-wrench',        route: '/app/os' },
    { label: 'Vendas',            icon: 'pi pi-shopping-cart', route: '/app/vendas' },
    { label: 'Estoque',           icon: 'pi pi-box',           route: '/app/estoque' },
    { label: 'Financeiro',        icon: 'pi pi-wallet',        route: '/app/financeiro' },
    { label: 'Equipamentos',      icon: 'pi pi-desktop',       route: '/app/equipamentos' },
    { label: 'Funcionários',      icon: 'pi pi-id-card',       route: '/app/funcionarios' },
    { label: 'Fornecedores',      icon: 'pi pi-truck',         route: '/app/fornecedores' },
    { label: 'Compras',           icon: 'pi pi-shopping-bag',  route: '/app/compras' },
    { label: 'Contratos',         icon: 'pi pi-file',          route: '/app/contratos' },
    { label: 'Devoluções',        icon: 'pi pi-replay',        route: '/app/devolucoes' },
    { label: 'Serviços',          icon: 'pi pi-briefcase',     route: '/app/servicos' },
    { label: 'Configurações',     icon: 'pi pi-cog',           route: '/app/configuracoes' },
    { label: 'Logs de Auditoria', icon: 'pi pi-history',       route: '/app/logs' },
  ];

  get userEmail()   { return this.user()?.email ?? ''; }
  get userInitial() { return this.userEmail.charAt(0).toUpperCase() || '?'; }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
}
