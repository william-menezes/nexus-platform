import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Supplier } from '@nexus-platform/shared-types';
import { SuppliersService } from '../../suppliers.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-supplier-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    InputTextModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './supplier-list.component.html',
})
export class SupplierListComponent implements OnInit {
  private readonly svc = inject(SuppliersService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Fornecedores', routerLink: '/app/fornecedores' }];

  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search = '';

  ngOnInit() { this.load(); }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.search || undefined).subscribe({
      next: data => { this.suppliers.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.suppliers().length, this.tablePage()),
      this.suppliers().length
    );
  }

  confirmDelete(s: Supplier) {
    this.confirm.confirm({
      message: `Excluir fornecedor "${s.name}"?`,
      header: 'Confirmar exclus?o',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(s.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Exclu?do', detail: s.name });
            this.load();
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
