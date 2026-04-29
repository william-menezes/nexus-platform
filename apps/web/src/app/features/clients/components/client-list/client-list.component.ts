import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MenuItem } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';
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
  imports: [FormsModule, RouterLink, DatePipe, BreadcrumbModule, ButtonModule, TableModule],
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit {
  private readonly svc = inject(ClientsService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Clientes', routerLink: '/app/clientes' }];

  clients = signal<Client[]>([]);
  loading = signal(false);
  error   = signal('');
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search  = '';

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
