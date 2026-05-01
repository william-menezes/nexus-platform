import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Return } from '@nexus-platform/shared-types';
import { ReturnsService } from '../../returns.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';


const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovada',
  completed: 'Conclu?da', rejected: 'Rejeitada',
};
const STATUS_SEVERITY: Record<string, string> = {
  pending: 'warn', approved: 'info',
  completed: 'success', rejected: 'danger',
};
const TYPE_LABELS: Record<string, string> = {
  refund: 'Estorno', credit: 'Cr?dito', exchange: 'Troca',
};

@Component({
  standalone: true,
  selector: 'app-return-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, CardModule, SelectModule, TagModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './return-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnListComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly msg = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly returns = signal<Return[]>([]);
  readonly loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  statusFilter: string | null = null;

  constructor() { this.breadcrumbSvc.set([{ label: 'Devoluções' }]); }

  readonly statusOptions = [
    { label: 'Pendente',   value: 'pending' },
    { label: 'Aprovada',   value: 'approved' },
    { label: 'Conclu?da',  value: 'completed' },
    { label: 'Rejeitada',  value: 'rejected' },
  ];

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

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
  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.returns().length, this.tablePage()),
      this.returns().length
    );
  }
}
