import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Contract } from '@nexus-platform/shared-types';
import { ContractsService } from '../../contracts.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', active: 'Ativo', suspended: 'Suspenso',
  cancelled: 'Cancelado', expired: 'Expirado',
};
const STATUS_SEVERITY: Record<string, string> = {
  draft: 'secondary', active: 'success', suspended: 'warn',
  cancelled: 'danger', expired: 'secondary',
};
const TYPE_LABELS: Record<string, string> = {
  fixed: 'Mensal Fixo',
  hourly_franchise: 'Franquia de Horas',
};

@Component({
  standalone: true,
  selector: 'app-contract-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, SelectModule, TagModule,
    ConfirmDialogModule, ToastModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './contract-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractListComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly contracts = signal<Contract[]>([]);
  readonly loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  statusFilter: string | null = null;

  readonly statusOptions = [
    { label: 'Rascunho',  value: 'draft' },
    { label: 'Ativo',     value: 'active' },
    { label: 'Suspenso',  value: 'suspended' },
    { label: 'Cancelado', value: 'cancelled' },
    { label: 'Expirado',  value: 'expired' },
  ];

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Contratos' }]);
  }

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.statusFilter ?? undefined).subscribe({
      next: data => { this.contracts.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }
  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.contracts().length, this.tablePage()),
      this.contracts().length
    );
  }

  confirmDelete(c: Contract) {
    this.confirm.confirm({
      message: `Excluir contrato "${c.code}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(c.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: c.code });
            this.load();
          },
          error: (err) => this.msg.add({
            severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message,
          }),
        });
      },
    });
  }
}
