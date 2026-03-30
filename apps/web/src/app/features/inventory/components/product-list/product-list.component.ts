import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Product } from '@nexus-platform/shared-types';
import { InventoryService } from '../../inventory.service';

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [CurrencyPipe, RouterLink, TableModule, TagModule, ButtonModule, SkeletonModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private readonly svc     = inject(InventoryService);
  private readonly confirm = inject(ConfirmationService);
  private readonly toast   = inject(MessageService);

  products: Product[] = [];
  loading = true;

  ngOnInit() {
    this.svc.getProducts().subscribe({
      next: (data) => { this.products = data; this.loading = false; },
      error: ()     => { this.loading = false; },
    });
  }

  remove(id: string) {
    this.confirm.confirm({
      message: 'Deseja excluir este produto?',
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.removeProduct(id).subscribe(() => {
          this.products = this.products.filter(p => p.id !== id);
          this.toast.add({ severity: 'success', summary: 'Produto excluído', life: 3000 });
        });
      },
    });
  }
}
