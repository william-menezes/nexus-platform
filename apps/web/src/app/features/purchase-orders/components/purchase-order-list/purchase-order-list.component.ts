import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PurchaseOrder } from '@nexus-platform/shared-types';
import { PurchaseOrdersService } from '../../purchase-orders.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

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
    TableModule, ButtonModule, CardModule, SelectModule, TagModule,
    ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './purchase-order-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderListComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() { this.breadcrumbSvc.set([{ label: 'Pedidos de Compra' }]); }

  readonly orders = signal<PurchaseOrder[]>([]);
  readonly loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  statusFilter: string | null = null;

  readonly statusOptions = [
    { label: 'Rascunho',  value: 'draft' },
    { label: 'Enviado',   value: 'sent' },
    { label: 'Parcial',   value: 'partial' },
    { label: 'Recebido',  value: 'received' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

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
  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.orders().length, this.tablePage()),
      this.orders().length
    );
  }

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
