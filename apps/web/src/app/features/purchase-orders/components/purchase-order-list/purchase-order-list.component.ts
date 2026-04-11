import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PurchaseOrder } from '@nexus-platform/shared-types';
import { PurchaseOrdersService } from '../../purchase-orders.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  partial: 'Parcial',
  received: 'Recebido',
  cancelled: 'Cancelado',
};

const STATUS_SEVERITY: Record<string, string> = {
  draft: 'secondary',
  sent: 'info',
  partial: 'warn',
  received: 'success',
  cancelled: 'danger',
};

@Component({
  standalone: true,
  selector: 'app-purchase-order-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, SelectModule, TagModule,
    ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Pedidos de Compra</h1>
        <a routerLink="nova" pButton label="Novo Pedido" icon="pi pi-plus" class="p-button-sm"></a>
      </div>

      <div class="mb-3 flex gap-2 items-center">
        <p-select [options]="statusOptions" [(ngModel)]="statusFilter"
          optionLabel="label" optionValue="value"
          placeholder="Todos os status" [showClear]="true"
          (onChange)="load()" styleClass="w-48" />
      </div>

      <p-table [value]="orders()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Fornecedor</th>
            <th>Status</th>
            <th>Total</th>
            <th>Previsão</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-po>
          <tr>
            <td>
              <a [routerLink]="[po.id]" class="text-primary font-medium hover:underline">
                {{ po.code }}
              </a>
            </td>
            <td>{{ po.supplier?.name || po.supplierId }}</td>
            <td>
              <p-tag [value]="statusLabel(po.status)" [severity]="statusSeverity(po.status)" />
            </td>
            <td>{{ po.total | currency:'BRL':'symbol':'1.2-2' }}</td>
            <td>{{ po.expectedAt ? (po.expectedAt | date:'dd/MM/yyyy') : '—' }}</td>
            <td>{{ po.createdAt | date:'dd/MM/yyyy' }}</td>
            <td>
              <a [routerLink]="[po.id]" pButton icon="pi pi-eye"
                class="p-button-sm p-button-text mr-1" pTooltip="Ver detalhes"
                aria-label="Ver detalhes"></a>
              <button pButton icon="pi pi-trash"
                class="p-button-sm p-button-text p-button-danger"
                [disabled]="!canDelete(po.status)"
                (click)="confirmDelete(po)" pTooltip="Excluir"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center text-gray-500 py-8">
              Nenhum pedido de compra encontrado.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class PurchaseOrderListComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly orders = signal<PurchaseOrder[]>([]);
  readonly loading = signal(false);
  statusFilter: string | null = null;

  readonly statusOptions = [
    { label: 'Rascunho',  value: 'draft' },
    { label: 'Enviado',   value: 'sent' },
    { label: 'Parcial',   value: 'partial' },
    { label: 'Recebido',  value: 'received' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.statusFilter ?? undefined).subscribe({
      next: data => { this.orders.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  statusLabel(status: string) { return STATUS_LABELS[status] ?? status; }
  statusSeverity(status: string): any { return STATUS_SEVERITY[status] ?? 'secondary'; }
  canDelete(status: string) { return status === 'draft' || status === 'cancelled'; }

  confirmDelete(po: PurchaseOrder) {
    this.confirm.confirm({
      message: `Excluir pedido "${po.code}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(po.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: po.code });
            this.load();
          },
          error: (err) => this.msg.add({
            severity: 'error',
            summary: 'Erro ao excluir',
            detail: err?.error?.message ?? '',
          }),
        });
      },
    });
  }
}
