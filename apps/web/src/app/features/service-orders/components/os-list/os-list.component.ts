import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { ServiceOrder } from '@nexus-platform/shared-types';
import { ServiceOrdersService } from '../../service-orders.service';

@Component({
  standalone: true,
  selector: 'app-os-list',
  imports: [DatePipe, RouterLink, ButtonModule, MessageModule, TableModule, TagModule, TooltipModule, BreadcrumbModule],
  templateUrl: './os-list.component.html',
})
export class OsListComponent implements OnInit {
  private readonly svc = inject(ServiceOrdersService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Ordens de Serviço', routerLink: '/app/os' }];

  orders  = signal<ServiceOrder[]>([]);
  loading = signal(false);
  error   = signal('');

  readonly statusLabel: Record<string, string> = {
    open:           'Aberta',
    in_progress:    'Em andamento',
    awaiting_parts: 'Aguardando peças',
    done:           'Concluída',
    cancelled:      'Cancelada',
  };

  readonly statusClass: Record<string, string> = {
    open:           'bg-primary-50 text-primary-700',
    in_progress:    'bg-warning-50 text-warning-700',
    awaiting_parts: 'bg-secondary-50 text-secondary-700',
    done:           'bg-success-50 text-success-700',
    cancelled:      'bg-danger-50 text-danger-700',
  };

  readonly statusSeverity: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    open:           'info',
    in_progress:    'warn',
    awaiting_parts: 'secondary',
    done:           'success',
    cancelled:      'danger',
  };

  ngOnInit() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => { this.orders.set(data); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar ordens.'); this.loading.set(false); },
    });
  }
}
