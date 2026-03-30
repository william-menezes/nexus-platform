import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, SlicePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Sale } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberta', paid: 'Paga', cancelled: 'Cancelada',
};

@Component({
  standalone: true,
  selector: 'app-sales-list',
  imports: [DatePipe, SlicePipe, CurrencyPipe, RouterLink, TableModule, TagModule, ButtonModule],
  templateUrl: './sales-list.component.html',
})
export class SalesListComponent implements OnInit {
  private readonly svc = inject(FinanceService);

  sales: Sale[] = [];
  loading = true;

  statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

  ngOnInit() {
    this.svc.getSales().subscribe({
      next: (data) => { this.sales = data; this.loading = false; },
      error: ()     => { this.loading = false; },
    });
  }

  cancel(id: string) {
    this.svc.cancelSale(id).subscribe((updated) => {
      this.sales = this.sales.map(s => s.id === id ? updated : s);
    });
  }
}
