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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
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
    ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './purchase-order-list.component.html',
})
export class PurchaseOrderListComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Pedidos de Compra', routerLink: '/app/compras' }];

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
