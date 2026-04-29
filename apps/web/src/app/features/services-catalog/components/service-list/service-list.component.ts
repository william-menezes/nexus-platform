import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ServiceCatalog } from '@nexus-platform/shared-types';
import { ServicesCatalogService } from '../../services-catalog.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-service-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    InputTextModule, TagModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './service-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceListComponent implements OnInit {
  private svc = inject(ServicesCatalogService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Serviços', routerLink: '/app/servicos' }];

  services = signal<ServiceCatalog[]>([]);
  loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search = '';

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.search || undefined).subscribe({
      next: data => { this.services.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.services().length, this.tablePage()),
      this.services().length
    );
  }

  confirmDelete(s: ServiceCatalog) {
    this.confirm.confirm({
      message: `Remover serviço "${s.name}"?`,
      accept: () => this.svc.remove(s.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
