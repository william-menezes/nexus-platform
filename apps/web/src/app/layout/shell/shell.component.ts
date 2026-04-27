import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { LayoutService } from '../../core/layout/layout.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit {
  private readonly auth      = inject(AuthService);
  private readonly tenantSvc = inject(TenantService);
  readonly layout            = inject(LayoutService);

  async ngOnInit() {
    const me = await this.auth.refreshMe();
    if (me?.tenant) this.tenantSvc.setFromMe(me.tenant);
  }
}
