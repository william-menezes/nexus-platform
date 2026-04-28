import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { GeneralSettingsComponent } from './components/general/general-settings.component';
import { CustomStatusesComponent } from './components/custom-statuses/custom-statuses.component';
import { PermissionsComponent } from './components/permissions/permissions.component';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [
    CommonModule, TabsModule, BreadcrumbModule,
    GeneralSettingsComponent, CustomStatusesComponent, PermissionsComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Configurações' }];
}
