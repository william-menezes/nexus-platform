import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ServiceOrder } from '@nexus-platform/shared-types';
import { ServiceOrdersService } from '../../service-orders.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PageHeaderViewToggleOption } from '../../../../shared/models/page-header.types';

@Component({
  standalone: true,
  selector: 'app-os-list',
  imports: [DatePipe, RouterLink, ButtonModule, MessageModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule, ToastModule, PageHeaderComponent],
  providers: [ConfirmationService, MessageService],
  templateUrl: './os-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsListComponent implements OnInit {
  private readonly svc             = inject(ServiceOrdersService);
  private readonly breadcrumbSvc   = inject(BreadcrumbService);
  private readonly confirm         = inject(ConfirmationService);
  private readonly msg             = inject(MessageService);

  orders  = signal<ServiceOrder[]>([]);
  loading = signal(false);
  error   = signal('');
  readonly tablePage = signal(createInitialTablePageState(15));
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  readonly viewMode = signal<string>('list');
  readonly viewToggleOptions: PageHeaderViewToggleOption[] = [
    { label: 'Lista', icon: 'pi-list', value: 'list' },
    { label: 'Kanban', icon: 'pi-th-large', value: 'kanban' },
  ];

  readonly statusLabel: Record<string, string> = {
    open:           'Aberta',
    in_progress:    'Em andamento',
    awaiting_parts: 'Aguardando peças',
    done:           'Concluída',
    cancelled:      'Cancelada',
  };

  readonly statusClass: Record<string, string> = {
    open:           'bg-primary-50 text-primary-700',
    in_progress:    'bg-warning-50 text-warning-700',
    awaiting_parts: 'bg-secondary-50 text-secondary-700',
    done:           'bg-success-50 text-success-700',
    cancelled:      'bg-danger-50 text-danger-700',
  };

  readonly statusSeverity: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    open:           'info',
    in_progress:    'warn',
    awaiting_parts: 'secondary',
    done:           'success',
    cancelled:      'danger',
  };

  ngOnInit() {
    this.breadcrumbSvc.set([{ label: 'Ordens de Serviço' }]);
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => { this.orders.set(data); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar ordens.'); this.loading.set(false); },
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.orders().length, this.tablePage()),
      this.orders().length
    );
  }

  confirmDelete(os: ServiceOrder) {
    this.confirm.confirm({
      message: `Excluir OS "${os.code}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(os.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'OS excluída', detail: os.code });
            this.orders.update(list => list.filter(o => o.id !== os.id));
          },
          error: (err) => this.msg.add({ severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message ?? '' }),
        });
      },
    });
  }
}
