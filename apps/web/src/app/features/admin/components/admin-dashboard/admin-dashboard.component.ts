import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { AdminService, AdminMetrics } from '../../admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, BreadcrumbModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly svc = inject(AdminService);
  readonly metrics = signal<AdminMetrics | null>(null);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/admin/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Dashboard Admin', routerLink: '/admin/dashboard' }];

  ngOnInit() {
    this.svc.getMetrics().subscribe(m => this.metrics.set(m));
  }
}
