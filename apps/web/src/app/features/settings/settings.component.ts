import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { GeneralSettingsComponent } from './components/general/general-settings.component';
import { CustomStatusesComponent } from './components/custom-statuses/custom-statuses.component';
import { PermissionsComponent } from './components/permissions/permissions.component';
import { BreadcrumbService } from '../../core/breadcrumb/breadcrumb.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [
    CommonModule, TabsModule,
    GeneralSettingsComponent, CustomStatusesComponent, PermissionsComponent,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Configurações' }]);
  }
}
