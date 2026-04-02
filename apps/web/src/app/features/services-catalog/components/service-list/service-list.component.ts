import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ServiceCatalog } from '@nexus-platform/shared-types';
import { ServicesCatalogService } from '../../services-catalog.service';

@Component({
  standalone: true,
  selector: 'app-service-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    InputTextModule, TagModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Catálogo de Serviços</h1>
        <a routerLink="novo" pButton label="Novo Serviço" icon="pi pi-plus" class="p-button-sm"></a>
      </div>
      <div class="mb-3">
        <input pInputText [(ngModel)]="search" (ngModelChange)="load()" placeholder="Buscar serviço..." class="w-full md:w-1/3" />
      </div>
      <p-table [value]="services()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Preço Padrão</th>
            <th>Horas Est.</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-s>
          <tr>
            <td>{{ s.name }}</td>
            <td>{{ s.description || '—' }}</td>
            <td>{{ s.defaultPrice | currency:'BRL' }}</td>
            <td>{{ s.estimatedHours ? s.estimatedHours + 'h' : '—' }}</td>
            <td>
              <p-tag [severity]="s.isActive ? 'success' : 'danger'" [value]="s.isActive ? 'Ativo' : 'Inativo'" />
            </td>
            <td>
              <a [routerLink]="[s.id, 'editar']" pButton icon="pi pi-pencil" class="p-button-sm p-button-text mr-1"></a>
              <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(s)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" class="text-center py-8 text-gray-400">Nenhum serviço encontrado</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class ServiceListComponent implements OnInit {
  private svc = inject(ServicesCatalogService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  services = signal<ServiceCatalog[]>([]);
  loading = signal(false);
  search = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.search || undefined).subscribe({
      next: data => { this.services.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirmDelete(s: ServiceCatalog) {
    this.confirm.confirm({
      message: `Remover serviço "${s.name}"?`,
      accept: () => this.svc.remove(s.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
