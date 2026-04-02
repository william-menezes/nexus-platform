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
import { Employee } from '@nexus-platform/shared-types';
import { EmployeesService } from '../../employees.service';

@Component({
  standalone: true,
  selector: 'app-employee-list',
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
        <h1 class="text-2xl font-bold">Funcionários</h1>
        <a routerLink="novo" pButton label="Novo Funcionário" icon="pi pi-plus" class="p-button-sm"></a>
      </div>
      <div class="mb-3">
        <input pInputText [(ngModel)]="search" (ngModelChange)="load()" placeholder="Buscar por nome..." class="w-full md:w-1/3" />
      </div>
      <p-table [value]="employees()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>Cargo</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Comissão</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr>
            <td>{{ e.name }}</td>
            <td>{{ e.roleLabel || '—' }}</td>
            <td>{{ e.phone || '—' }}</td>
            <td>{{ e.email || '—' }}</td>
            <td>{{ e.commissionRate }}%</td>
            <td>
              <p-tag [severity]="e.isActive ? 'success' : 'danger'" [value]="e.isActive ? 'Ativo' : 'Inativo'" />
            </td>
            <td>
              <a [routerLink]="[e.id, 'editar']" pButton icon="pi pi-pencil" class="p-button-sm p-button-text mr-1"></a>
              <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(e)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" class="text-center py-8 text-gray-400">Nenhum funcionário encontrado</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class EmployeeListComponent implements OnInit {
  private svc = inject(EmployeesService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  employees = signal<Employee[]>([]);
  loading = signal(false);
  search = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.search || undefined).subscribe({
      next: data => { this.employees.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirmDelete(e: Employee) {
    this.confirm.confirm({
      message: `Remover funcionário "${e.name}"?`,
      accept: () => this.svc.remove(e.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
