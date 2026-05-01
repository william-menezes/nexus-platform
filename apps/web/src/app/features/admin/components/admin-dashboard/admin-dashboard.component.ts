import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AdminService, AdminMetrics } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly svc = inject(AdminService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);
  readonly metrics = signal<AdminMetrics | null>(null);

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Admin Dashboard' }]);
  }

  ngOnInit() {
    this.svc.getMetrics().subscribe(m => this.metrics.set(m));
  }
}
