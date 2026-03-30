import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { FinanceService } from '../finance/finance.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, SkeletonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly osSvc      = inject(ServiceOrdersService);
  private readonly financeSvc = inject(FinanceService);

  loading = true;

  stats = {
    openOrders:     0,
    inProgressOrders: 0,
    doneToday:      0,
    revenueMonth:   0,
  };

  ngOnInit() {
    this.osSvc.getAll().subscribe({
      next: (orders) => {
        this.stats.openOrders       = orders.filter(o => o.status === 'open').length;
        this.stats.inProgressOrders = orders.filter(o => o.status === 'in_progress' || o.status === 'awaiting_parts').length;
        const today = new Date().toISOString().slice(0, 10);
        this.stats.doneToday        = orders.filter(o => o.status === 'done' && o.updatedAt?.startsWith(today)).length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
