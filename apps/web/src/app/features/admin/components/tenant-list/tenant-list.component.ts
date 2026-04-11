import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminService, AdminTenant } from '../../admin.service';

const PLAN_SEVERITY: Record<string, string> = {
  trial: 'warn', starter: 'info', pro: 'success', enterprise: 'contrast',
};

@Component({
  standalone: true,
  selector: 'app-tenant-list',
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/admin" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">Tenants</h1>
      </div>

      <div class="mb-3">
        <input pInputText [(ngModel)]="search" (input)="load()"
          placeholder="Buscar por nome..." class="w-full md:w-1/3" />
      </div>

      <p-table [value]="tenants()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Segmento</th>
            <th>Trial até</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-t>
          <tr>
            <td>
              <a [routerLink]="[t.id]" class="font-medium text-primary hover:underline">
                {{ t.name }}
              </a>
              <span class="text-xs text-gray-400 ml-1">/ {{ t.slug }}</span>
            </td>
            <td>
              <p-tag [value]="t.plan" [severity]="planSeverity(t.plan)" />
            </td>
            <td>
              <p-tag [value]="t.is_active ? 'Ativo' : 'Inativo'"
                [severity]="t.is_active ? 'success' : 'danger'" />
            </td>
            <td class="capitalize">{{ t.segment || '—' }}</td>
            <td>{{ t.trial_ends_at ? (t.trial_ends_at | date:'dd/MM/yyyy') : '—' }}</td>
            <td>{{ t.created_at | date:'dd/MM/yyyy' }}</td>
            <td>
              <a [routerLink]="[t.id]" pButton icon="pi pi-pencil"
                class="p-button-sm p-button-text" aria-label="Editar tenant"></a>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center text-gray-500 py-8">Nenhum tenant encontrado.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class TenantListComponent implements OnInit {
  private readonly svc = inject(AdminService);
  readonly tenants = signal<AdminTenant[]>([]);
  readonly loading = signal(false);
  search = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAllTenants(this.search || undefined).subscribe({
      next: data => { this.tenants.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  planSeverity(plan: string): any { return PLAN_SEVERITY[plan] ?? 'secondary'; }
}
