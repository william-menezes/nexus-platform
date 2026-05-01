import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Product } from '@nexus-platform/shared-types';
import { InventoryService } from '../../inventory.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [
    CurrencyPipe, RouterLink, TableModule, ButtonModule, CardModule, TagModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly svc = inject(InventoryService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() { this.breadcrumbSvc.set([{ label: 'Estoque' }]); }

  products    = signal<Product[]>([]);
  loading     = signal(false);
  readonly tablePage = signal(createInitialTablePageState(15));
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;

  ngOnInit() {
    this.loading.set(true);
    this.svc.getProducts().subscribe({
      next: (data) => { this.products.set(data); this.loading.set(false); },
      error: ()     => { this.loading.set(false); },
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.products().length, this.tablePage()),
      this.products().length
    );
  }

  remove(id: string) {
    const product = this.products().find(p => p.id === id);
    this.confirm.confirm({
      message: `Excluir produto "${product?.name ?? '?'}"?`,
      header: 'Confirmar exclus?o',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.removeProduct(id).subscribe({
          next: () => {
            this.products.update(list => list.filter(p => p.id !== id));
            this.msg.add({ severity: 'success', summary: 'Exclu?do', detail: product?.name ?? 'Produto removido' });
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
