import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AdminService, AdminMetrics } from '../../admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  template: `
    <div class="nx-page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Painel Super Admin</h1>
          <p class="text-gray-500 text-sm mt-1">Visão geral de todos os tenants</p>
        </div>
        <a routerLink="tenants" pButton label="Ver Tenants" icon="pi pi-list" class="p-button-sm"></a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" *ngIf="metrics(); else loadingTpl">
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
          <span class="text-sm text-gray-500">Total de Tenants</span>
          <span class="text-3xl font-bold text-gray-900">{{ metrics()!.totalTenants }}</span>
          <span class="text-xs text-gray-400">todos os cadastrados</span>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
          <span class="text-sm text-gray-500">Tenants Ativos</span>
          <span class="text-3xl font-bold text-green-600">{{ metrics()!.activeTenants }}</span>
          <span class="text-xs text-gray-400">is_active = true</span>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
          <span class="text-sm text-gray-500">Em Trial</span>
          <span class="text-3xl font-bold text-amber-500">{{ metrics()!.trialTenants }}</span>
          <span class="text-xs text-gray-400">plano = trial</span>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
          <span class="text-sm text-gray-500">Novos (30 dias)</span>
          <span class="text-3xl font-bold text-blue-600">{{ metrics()!.recentSignups }}</span>
          <span class="text-xs text-gray-400">últimos 30 dias</span>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="flex justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl text-gray-400"></i>
        </div>
      </ng-template>

      <!-- Quick link -->
      <p-card header="Ações Rápidas">
        <div class="flex flex-wrap gap-3">
          <a routerLink="tenants" pButton label="Gerenciar Tenants"
            icon="pi pi-building" class="p-button-outlined p-button-sm"></a>
        </div>
      </p-card>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly svc = inject(AdminService);
  readonly metrics = signal<AdminMetrics | null>(null);

  ngOnInit() {
    this.svc.getMetrics().subscribe(m => this.metrics.set(m));
  }
}
