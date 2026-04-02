import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { GeneralSettingsComponent } from './components/general/general-settings.component';
import { CustomStatusesComponent } from './components/custom-statuses/custom-statuses.component';
import { PermissionsComponent } from './components/permissions/permissions.component';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [
    CommonModule, TabsModule,
    GeneralSettingsComponent, CustomStatusesComponent, PermissionsComponent,
  ],
  template: `
    <div class="nx-page">
      <h1 class="text-2xl font-bold mb-4">Configurações</h1>
      <p-tabs>
        <p-tablist>
          <p-tab value="general">Geral</p-tab>
          <p-tab value="statuses">Status Personalizados</p-tab>
          <p-tab value="permissions">Permissões</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="general">
            <app-general-settings />
          </p-tabpanel>
          <p-tabpanel value="statuses">
            <app-custom-statuses />
          </p-tabpanel>
          <p-tabpanel value="permissions">
            <app-permissions />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
})
export class SettingsComponent {}
