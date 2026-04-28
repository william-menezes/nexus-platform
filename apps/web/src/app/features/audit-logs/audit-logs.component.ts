import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { environment } from '../../../environments/environment';
import type { TableLazyLoadEvent } from 'primeng/table';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_SEVERITY: Record<string, string> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  status_change: 'warn',
  login: 'secondary',
};

const ENTITY_LABELS: Record<string, string> = {
  service_order: 'OS',
  sale: 'Venda',
  client: 'Cliente',
  quote: 'Orçamento',
  product: 'Produto',
  employee: 'Funcionário',
  supplier: 'Fornecedor',
};

@Component({
  standalone: true,
  selector: 'app-audit-logs',
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, SelectModule, DatePickerModule, TagModule, DialogModule,
    BreadcrumbModule,
  ],
  providers: [DatePipe],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Logs de Auditoria', routerLink: '/app/logs' }];

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly selectedLog = signal<AuditLog | null>(null);
  detailVisible = false;

  filterAction = '';
  filterEntity = '';
  filterFrom: Date | null = null;
  filterTo: Date | null = null;

  private currentOffset = 0;
  private readonly pageSize = 50;

  readonly actionOptions = [
    { label: 'Criar', value: 'create' },
    { label: 'Atualizar', value: 'update' },
    { label: 'Excluir', value: 'delete' },
    { label: 'Mudar status', value: 'status_change' },
    { label: 'Login', value: 'login' },
  ];

  readonly entityOptions = Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }));

  ngOnInit() { this.load(); }

  onPage(event: TableLazyLoadEvent) {
    this.currentOffset = event.first ?? 0;
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = {
      limit: String(this.pageSize),
      offset: String(this.currentOffset),
    };
    if (this.filterAction) params['action'] = this.filterAction;
    if (this.filterEntity) params['entity'] = this.filterEntity;
    if (this.filterFrom) params['from'] = this.filterFrom.toISOString();
    if (this.filterTo) params['to'] = this.filterTo.toISOString();

    this.http.get<{ data: AuditLog[]; total: number }>(
      `${environment.apiUrl}/settings/audit-logs`,
      { params }
    ).subscribe({
      next: res => {
        // handle both array and paginated response
        const data = Array.isArray(res) ? res : res.data;
        const total = Array.isArray(res) ? res.length : res.total;
        this.logs.set(data);
        this.total.set(total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  showDetail(log: AuditLog) {
    this.selectedLog.set(log);
    this.detailVisible = true;
  }

  actionSeverity(action: string): any {
    return ACTION_SEVERITY[action] ?? 'secondary';
  }

  entityLabel(entity: string): string {
    return ENTITY_LABELS[entity] ?? entity;
  }
}
