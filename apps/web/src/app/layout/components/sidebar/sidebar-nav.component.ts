import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { LayoutService } from '../../../core/layout/layout.service';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

interface NavGroup { label: string; items: NavItem[]; }
interface NavItem  { label: string; icon: string; route: string; }

@Component({
  standalone: true,
  selector: 'app-sidebar-nav',
  imports: [RouterLink, RouterLinkActive, AvatarModule, ButtonModule, TooltipModule],
  templateUrl: './sidebar-nav.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
})
export class SidebarNavComponent {
  readonly layout = inject(LayoutService);
  readonly tenant = inject(TenantService);

  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly user   = toSignal(this.auth.user$);

  readonly userEmail   = computed(() => this.user()?.email ?? '');
  readonly userName    = computed(() => this.user()?.user_metadata?.['full_name'] ?? this.userEmail());
  readonly userInitial = computed(() => (this.userName() || this.userEmail()).charAt(0).toUpperCase() || '?');
  readonly isTrialPlan = computed(() => !this.tenant.plan() || this.tenant.plan() === 'trial');

  readonly navGroups: NavGroup[] = [
    {
      label: 'Visão Geral',
      items: [{ label: 'Dashboard', icon: 'pi pi-home', route: '/app/dashboard' }],
    },
    {
      label: 'Operacional',
      items: [
        { label: 'Clientes',          icon: 'pi pi-users',         route: '/app/clientes' },
        { label: 'Orçamentos',        icon: 'pi pi-file-edit',     route: '/app/orcamentos' },
        { label: 'Ordens de Serviço', icon: 'pi pi-wrench',        route: '/app/os' },
        { label: 'Vendas',            icon: 'pi pi-shopping-cart', route: '/app/vendas' },
        { label: 'Devoluções',        icon: 'pi pi-replay',        route: '/app/devolucoes' },
      ],
    },
    {
      label: 'Estoque',
      items: [
        { label: 'Estoque',      icon: 'pi pi-box',          route: '/app/estoque' },
        { label: 'Compras',      icon: 'pi pi-shopping-bag', route: '/app/compras' },
        { label: 'Fornecedores', icon: 'pi pi-truck',        route: '/app/fornecedores' },
      ],
    },
    {
      label: 'Financeiro',
      items: [
        { label: 'Financeiro', icon: 'pi pi-wallet', route: '/app/financeiro' },
        { label: 'Contratos',  icon: 'pi pi-file',   route: '/app/contratos' },
      ],
    },
    {
      label: 'Cadastros',
      items: [
        { label: 'Equipamentos', icon: 'pi pi-desktop',   route: '/app/equipamentos' },
        { label: 'Funcionários', icon: 'pi pi-id-card',   route: '/app/funcionarios' },
        { label: 'Serviços',     icon: 'pi pi-briefcase', route: '/app/servicos' },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { label: 'Configurações',     icon: 'pi pi-cog',     route: '/app/configuracoes' },
        { label: 'Logs de Auditoria', icon: 'pi pi-history', route: '/app/logs' },
      ],
    },
  ];

  onNavClick() { this.layout.closeSidebarOnMobile(); }

  async logout() {
    this.layout.closeSidebar();
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
