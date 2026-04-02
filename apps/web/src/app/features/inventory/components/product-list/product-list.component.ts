import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Product } from '@nexus-platform/shared-types';
import { InventoryService } from '../../inventory.service';

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [
    CurrencyPipe, RouterLink, TableModule, ButtonModule, TagModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private readonly svc = inject(InventoryService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  products    = signal<Product[]>([]);
  loading     = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.svc.getProducts().subscribe({
      next: (data) => { this.products.set(data); this.loading.set(false); },
      error: ()     => { this.loading.set(false); },
    });
  }

  remove(id: string) {
    const product = this.products().find(p => p.id === id);
    this.confirm.confirm({
      message: `Excluir produto "${product?.name ?? '—'}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.removeProduct(id).subscribe({
          next: () => {
            this.products.update(list => list.filter(p => p.id !== id));
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: product?.name ?? 'Produto removido' });
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
