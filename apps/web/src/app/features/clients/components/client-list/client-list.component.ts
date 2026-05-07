import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

type TypeFilter = 'all' | 'individual' | 'company';

const AVATAR_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-orange-50 text-orange-700',
  'bg-emerald-50 text-emerald-700',
  'bg-violet-50 text-violet-600',
  'bg-amber-50 text-amber-700',
];

@Component({
  standalone: true,
  selector: 'app-client-list',
  imports: [FormsModule, RouterLink, DatePipe, NgClass, ButtonModule, TableModule, ConfirmDialogModule, ToastModule, PageHeaderComponent],
  providers: [ConfirmationService, MessageService],
  templateUrl: './client-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {
  private readonly svc        = inject(ClientsService);
  private readonly confirm    = inject(ConfirmationService);
  private readonly msg        = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  clients  = signal<Client[]>([]);
  loading  = signal(false);
  error    = signal('');
  readonly tablePage          = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search     = '';
  typeFilter = signal<TypeFilter>('all');

  pfCount = computed(() => this.clients().filter(c => c.type === 'individual').length);
  pjCount = computed(() => this.clients().filter(c => c.type === 'company').length);

  displayClients = computed(() => {
    const f   = this.typeFilter();
    const all = this.clients();
    if (f === 'all') return all;
    return all.filter(c => c.type === f);
  });

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Clientes' }]);
  }

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update(s => updateTablePageState(s, event));
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getAll(this.search || undefined).subscribe({
      next:  data  => { this.clients.set(data); this.loading.set(false); },
      error: ()    => { this.error.set('Erro ao carregar clientes.'); this.loading.set(false); },
    });
  }

  onSearch() { this.load(); }

  setTypeFilter(f: TypeFilter) {
    this.typeFilter.set(f);
    this.tablePage.update(s => ({ ...s, first: 0 }));
  }

  confirmDelete(client: Client) {
    this.confirm.confirm({
      message: `Excluir cliente "${client.name}"?`,
      header:  'Confirmar exclusão',
      icon:    'pi pi-trash',
      accept:  () => {
        this.svc.remove(client.id).subscribe({
          next:  () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: client.name });
            this.load();
          },
          error: err => this.msg.add({
            severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message,
          }),
        });
      },
    });
  }

  avatarInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  avatarColorClass(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  tableSummary() {
    const total = this.displayClients().length;
    return formatTableSummary(getVisibleTableRecords(total, this.tablePage()), total);
  }
}
