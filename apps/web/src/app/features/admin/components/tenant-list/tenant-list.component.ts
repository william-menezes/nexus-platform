import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { AdminService, AdminTenant } from '../../admin.service';

const PLAN_SEVERITY: Record<string, string> = {
  trial: 'warn', starter: 'info', pro: 'success', enterprise: 'contrast',
};

@Component({
  standalone: true,
  selector: 'app-tenant-list',
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, ToastModule, BreadcrumbModule],
  providers: [MessageService],
  templateUrl: './tenant-list.component.html',
})
export class TenantListComponent implements OnInit {
  private readonly svc = inject(AdminService);
  readonly tenants = signal<AdminTenant[]>([]);
  readonly loading = signal(false);
  search = '';

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/admin/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Tenants', routerLink: '/admin/tenants' }];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAllTenants(this.search || undefined).subscribe({
      next: data => { this.tenants.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  planSeverity(plan: string): any { return PLAN_SEVERITY[plan] ?? 'secondary'; }
}
