import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FinancialEntry } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  standalone: true,
  selector: 'app-entry-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    TagModule, SelectModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Financeiro</h1>
        <div class="flex gap-2">
          <a routerLink="caixa" pButton label="Caixa" icon="pi pi-dollar" class="p-button-sm p-button-secondary"></a>
          <a routerLink="plano-de-contas" pButton label="Plano de Contas" icon="pi pi-list" class="p-button-sm p-button-secondary"></a>
          <a routerLink="lancamentos/novo" pButton label="Novo Lançamento" icon="pi pi-plus" class="p-button-sm"></a>
        </div>
      </div>

      <div class="flex gap-3 mb-4">
        <p-select [(ngModel)]="filterType" [options]="typeOptions" optionLabel="label" optionValue="value"
          placeholder="Tipo" (onChange)="load()" [style]="{ width: '150px' }" />
        <p-select [(ngModel)]="filterStatus" [options]="statusOptions" optionLabel="label" optionValue="value"
          placeholder="Status" (onChange)="load()" [style]="{ width: '150px' }" />
      </div>

      <p-table [value]="entries()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Total</th>
            <th>Pago</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr>
            <td>{{ e.description }}</td>
            <td>
              <p-tag [severity]="e.type === 'receivable' ? 'success' : 'danger'"
                [value]="e.type === 'receivable' ? 'A Receber' : 'A Pagar'" />
            </td>
            <td>{{ e.totalAmount | currency:'BRL' }}</td>
            <td>{{ e.paidAmount | currency:'BRL' }}</td>
            <td>{{ e.dueDate | date:'dd/MM/yyyy' }}</td>
            <td><p-tag [severity]="statusSeverity(e.status)" [value]="statusLabel(e.status)" /></td>
            <td>
              <a [routerLink]="['lancamentos', e.id]" pButton icon="pi pi-eye" class="p-button-sm p-button-text mr-1"></a>
              <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(e)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" class="text-center py-8 text-gray-400">Nenhum lançamento encontrado</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class EntryListComponent implements OnInit {
  private svc = inject(FinancialService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  entries = signal<FinancialEntry[]>([]);
  loading = signal(false);
  filterType = '';
  filterStatus = '';

  typeOptions = [
    { label: 'Todos', value: '' },
    { label: 'A Receber', value: 'receivable' },
    { label: 'A Pagar', value: 'payable' },
  ];

  statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendente', value: 'pending' },
    { label: 'Parcial', value: 'partial' },
    { label: 'Pago', value: 'paid' },
    { label: 'Vencido', value: 'overdue' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getEntries(this.filterType || undefined, this.filterStatus || undefined).subscribe({
      next: data => { this.entries.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string) {
    const map: Record<string, string> = {
      pending: 'Pendente', partial: 'Parcial', paid: 'Pago', overdue: 'Vencido', cancelled: 'Cancelado',
    };
    return map[status] ?? status;
  }

  statusSeverity(status: string): TagSeverity {
    const map: Record<string, TagSeverity> = {
      pending: 'warn', partial: 'info', paid: 'success', overdue: 'danger', cancelled: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  confirmDelete(e: FinancialEntry) {
    this.confirm.confirm({
      message: `Remover lançamento "${e.description}"?`,
      accept: () => this.svc.deleteEntry(e.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
