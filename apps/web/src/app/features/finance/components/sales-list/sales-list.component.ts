import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { Sale } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberta', paid: 'Paga', cancelled: 'Cancelada',
};

const STATUS_CLASS: Record<string, string> = {
  open:      'bg-warning-50 text-warning-700',
  paid:      'bg-success-50 text-success-700',
  cancelled: 'bg-danger-50 text-danger-700',
};

@Component({
  standalone: true,
  selector: 'app-sales-list',
  imports: [DatePipe, CurrencyPipe, SlicePipe, RouterLink, ButtonModule, TableModule, TagModule, BreadcrumbModule],
  templateUrl: './sales-list.component.html',
})
export class SalesListComponent implements OnInit {
  private readonly svc = inject(FinanceService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Vendas', routerLink: '/app/vendas' }];

  sales   = signal<Sale[]>([]);
  loading = signal(false);

  statusLabel = (s: string) => STATUS_LABEL[s] ?? s;
  statusClass = (s: string) => STATUS_CLASS[s] ?? 'bg-surface-muted text-text-secondary';

  ngOnInit() {
    this.loading.set(true);
    this.svc.getSales().subscribe({
      next: (data) => { this.sales.set(data); this.loading.set(false); },
      error: ()     => { this.loading.set(false); },
    });
  }

  cancel(id: string) {
    this.svc.cancelSale(id).subscribe((updated) => {
      this.sales.update(list => list.map(s => s.id === id ? updated : s));
    });
  }
}
