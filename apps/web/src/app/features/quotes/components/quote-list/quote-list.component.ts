import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-quote-list',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, CardModule, TagModule,
    ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './quote-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteListComponent implements OnInit {
  private svc            = inject(QuotesService);
  private confirm        = inject(ConfirmationService);
  private msg            = inject(MessageService);
  private breadcrumbSvc  = inject(BreadcrumbService);

  quotes = signal<Quote[]>([]);
  loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;

  ngOnInit() {
    this.breadcrumbSvc.set([{ label: 'Orçamentos' }]);
    this.load();
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: data => { this.quotes.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.quotes().length, this.tablePage()),
      this.quotes().length
    );
  }

  confirmDelete(q: Quote) {
    this.confirm.confirm({
      message: `Remover orçamento "${q.code}"?`,
      accept: () => this.svc.remove(q.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
