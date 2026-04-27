import { Component, inject } from '@angular/core';
import { TenantService } from '../../../core/tenant/tenant.service';
import { LayoutService } from '../../../core/layout/layout.service';
import { SidebarNavComponent } from './sidebar-nav.component';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [SidebarNavComponent],
  templateUrl: './sidebar.component.html',
  host: {
    class: 'nx-sidebar',
    '[class.open]': 'layout.sidebarVisible()',
  },
})
export class SidebarComponent {
  readonly layout = inject(LayoutService);
  readonly tenant = inject(TenantService);
}
