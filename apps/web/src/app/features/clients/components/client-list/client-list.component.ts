import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-client-list',
  imports: [FormsModule, RouterLink, DatePipe, ButtonModule, CardModule, TableModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './client-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {
  private readonly svc = inject(ClientsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  clients = signal<Client[]>([]);
  loading = signal(false);
  error   = signal('');
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search  = '';

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Clientes' }]);
  }

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getAll(this.search || undefined).subscribe({
      next: (data) => { this.clients.set(data); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar clientes.'); this.loading.set(false); },
    });
  }

  onSearch() { this.load(); }

  confirmDelete(client: Client) {
    this.confirm.confirm({
      message: `Excluir cliente "${client.name}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(client.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: client.name });
            this.load();
          },
          error: (err) => this.msg.add({
            severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message,
          }),
        });
      },
    });
  }

  clientTypeLabel(type: Client['type']) {
    return type === 'individual' ? 'Pessoa Fisica' : 'Pessoa Juridica';
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.clients().length, this.tablePage()),
      this.clients().length
    );
  }
}
