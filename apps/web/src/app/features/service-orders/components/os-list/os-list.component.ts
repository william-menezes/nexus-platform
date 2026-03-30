import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ServiceOrder } from '@nexus-platform/shared-types';
import { ServiceOrdersService } from '../../service-orders.service';

@Component({
  standalone: true,
  selector: 'app-os-list',
  imports: [DatePipe, RouterLink, TableModule, TagModule, ButtonModule, SkeletonModule, MessageModule],
  templateUrl: './os-list.component.html',
})
export class OsListComponent implements OnInit {
  private readonly svc = inject(ServiceOrdersService);

  orders: ServiceOrder[] = [];
  loading = true;
  error = '';

  readonly statusLabel: Record<string, string> = {
    open:            'Aberta',
    in_progress:     'Em andamento',
    awaiting_parts:  'Aguardando peças',
    done:            'Concluída',
    cancelled:       'Cancelada',
  };

  readonly statusSeverity: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    open:            'info',
    in_progress:     'warn',
    awaiting_parts:  'warn',
    done:            'success',
    cancelled:       'danger',
  };

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: (data) => { this.orders = data; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar ordens.'; this.loading = false; },
    });
  }
}
