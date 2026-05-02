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
import { Product, ProductType } from '@nexus-platform/shared-types';
import { InventoryService } from '../../inventory.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

type TypeFilter = ProductType | 'all';

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

  readonly products     = signal<Product[]>([]);
  readonly loading      = signal(false);
  readonly activeFilter = signal<TypeFilter>('all');
  readonly tablePage    = signal(createInitialTablePageState(15));
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;

  readonly filterOptions: { label: string; value: TypeFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Produtos', value: 'product' },
    { label: 'Peças', value: 'part' },
  ];

  ngOnInit() { this.load(); }

  setFilter(f: TypeFilter) {
    this.activeFilter.set(f);
    this.tablePage.update(s => ({ ...s, first: 0 }));
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.activeFilter();
    this.svc.getProducts(f === 'all' ? undefined : f).subscribe({
      next: (data) => { this.products.set(data); this.loading.set(false); },
      error: ()     => { this.loading.set(false); },
    });
  }

  typeLabel(type: ProductType): string {
    return type === 'part' ? 'Peça' : 'Produto';
  }

  typeSeverity(type: ProductType): 'info' | 'secondary' {
    return type === 'part' ? 'secondary' : 'info';
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
      message: `Excluir "${product?.name ?? '?'}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        this.svc.removeProduct(id).subscribe({
          next: () => {
            this.products.update(list => list.filter(p => p.id !== id));
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: product?.name });
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
