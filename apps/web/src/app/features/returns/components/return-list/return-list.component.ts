import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Return } from '@nexus-platform/shared-types';
import { ReturnsService } from '../../returns.service';


const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovada',
  completed: 'Concluída', rejected: 'Rejeitada',
};
const STATUS_SEVERITY: Record<string, string> = {
  pending: 'warn', approved: 'info',
  completed: 'success', rejected: 'danger',
};
const TYPE_LABELS: Record<string, string> = {
  refund: 'Estorno', credit: 'Crédito', exchange: 'Troca',
};

@Component({
  standalone: true,
  selector: 'app-return-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, SelectModule, TagModule, ToastModule,
],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Devoluções</h1>
        <a routerLink="nova" pButton aria-label="Nova Devolução" icon="pi pi-plus" class="p-button-sm"></a>
      </div>

      <div class="mb-3">
        <p-select [options]="statusOptions" [(ngModel)]="statusFilter"
          optionLabel="label" optionValue="value"
          placeholder="Todos os status" [showClear]="true"
          (onChange)="load()" styleClass="w-48" />
      </div>

      <p-table [value]="returns()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Venda</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Valor Total</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-r>
          <tr>
            <td>
              <a [routerLink]="[r.id]" class="text-primary font-medium hover:underline">
                {{ r.code }}
              </a>
            </td>
            <td>{{ r.saleCode || r.saleId }}</td>
            <td>{{ typeLabel(r.type) }}</td>
            <td><p-tag [value]="statusLabel(r.status)" [severity]="statusSeverity(r.status)" /></td>
            <td>{{ r.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</td>
            <td>{{ r.createdAt | date:'dd/MM/yyyy' }}</td>
            <td>
              <a [routerLink]="[r.id]" pButton icon="pi pi-eye"
                class="p-button-sm p-button-text" aria-label="Ver detalhes"></a>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center text-gray-500 py-8">
              Nenhuma devolução encontrada.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class ReturnListComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly msg = inject(MessageService);

  readonly returns = signal<Return[]>([]);
  readonly loading = signal(false);
  statusFilter: string | null = null;

  readonly statusOptions = [
    { label: 'Pendente',   value: 'pending' },
    { label: 'Aprovada',   value: 'approved' },
    { label: 'Concluída',  value: 'completed' },
    { label: 'Rejeitada',  value: 'rejected' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.statusFilter ?? undefined).subscribe({
      next: data => { this.returns.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }
}
