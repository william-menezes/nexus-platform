import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { FinancialEntry } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  standalone: true,
  selector: 'app-entry-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    CardModule, TagModule, SelectModule, ConfirmDialogModule, ToastModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './entry-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryListComponent implements OnInit {
  private svc = inject(FinancialService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() { this.breadcrumbSvc.set([{ label: 'Lançamentos' }]); }

  entries = signal<FinancialEntry[]>([]);
  loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
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

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

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

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.entries().length, this.tablePage()),
      this.entries().length
    );
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
