import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { ServiceOrdersService } from '../service-orders/service-orders.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [RouterLink, BreadcrumbModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly osSvc = inject(ServiceOrdersService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Dashboard', routerLink: '/app/dashboard' }];

  loading          = signal(false);
  openOrders       = signal(0);
  inProgressOrders = signal(0);
  doneToday        = signal(0);

  ngOnInit() {
    this.loading.set(true);
    this.osSvc.getAll().subscribe({
      next: (orders) => {
        this.openOrders.set(orders.filter(o => o.status === 'open').length);
        this.inProgressOrders.set(
          orders.filter(o => o.status === 'in_progress' || o.status === 'awaiting_parts').length,
        );
        const today = new Date().toISOString().slice(0, 10);
        this.doneToday.set(
          orders.filter(o => o.status === 'done' && o.updatedAt?.startsWith(today)).length,
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
