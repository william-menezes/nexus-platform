import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../../../core/layout/layout.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [ButtonModule, AvatarModule, MenuModule, TooltipModule],
  templateUrl: './header.component.html',
  host: { class: 'nx-header' },
})
export class HeaderComponent {
  readonly layout = inject(LayoutService);
  readonly theme  = inject(ThemeService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  private readonly user = toSignal(this.auth.user$);

  readonly userInitial = computed(() => {
    const name = this.user()?.user_metadata?.['full_name'] ?? this.user()?.email ?? '';
    return name.charAt(0).toUpperCase() || '?';
  });

  readonly userName = computed(() =>
    this.user()?.user_metadata?.['full_name'] ?? this.user()?.email ?? 'Usuário'
  );

  readonly userMenuItems: MenuItem[] = [
    { label: 'Meu Perfil', icon: 'pi pi-user' },
    { separator: true },
    { label: 'Sair', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
