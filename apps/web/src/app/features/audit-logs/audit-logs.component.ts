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
  ],
  providers: [DatePipe],
  template: `
    <div class="nx-page">
      <h1 class="text-2xl font-bold mb-4">Logs de Auditoria</h1>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <p-select [(ngModel)]="filterAction" [options]="actionOptions"
          optionLabel="label" optionValue="value" placeholder="Ação"
          [showClear]="true" (onChange)="load()" />

        <p-select [(ngModel)]="filterEntity" [options]="entityOptions"
          optionLabel="label" optionValue="value" placeholder="Entidade"
          [showClear]="true" (onChange)="load()" />

        <p-datepicker [(ngModel)]="filterFrom" placeholder="De" dateFormat="dd/mm/yy"
          [showClear]="true" (onSelect)="load()" (onClear)="load()" />

        <p-datepicker [(ngModel)]="filterTo" placeholder="Até" dateFormat="dd/mm/yy"
          [showClear]="true" (onSelect)="load()" (onClear)="load()" />
      </div>

      <p-table [value]="logs()" [loading]="loading()" stripedRows [paginator]="true"
        [rows]="50" [totalRecords]="total()" [lazy]="true" (onLazyLoad)="onPage($event)">
        <ng-template pTemplate="header">
          <tr>
            <th>Data/Hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Entidade</th>
            <th>ID</th>
            <th>Detalhes</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-log>
          <tr>
            <td class="text-sm text-gray-600">
              {{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}
            </td>
            <td class="text-sm font-mono">{{ log.userId | slice:0:8 }}...</td>
            <td>
              <p-tag [severity]="actionSeverity(log.action)" [value]="log.action" />
            </td>
            <td>{{ entityLabel(log.entity) }}</td>
            <td class="text-sm font-mono text-gray-500">
              {{ log.entityId ? (log.entityId | slice:0:8) + '...' : '—' }}
            </td>
            <td>
              @if (log.oldData || log.newData) {
                <button pButton icon="pi pi-eye" class="p-button-sm p-button-text"
                  (click)="showDetail(log)"></button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center text-gray-500 py-8">
              Nenhum log encontrado.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Detail dialog -->
    <p-dialog [(visible)]="detailVisible" header="Detalhes da Alteração"
      [modal]="true" [style]="{ width: '600px' }">
      @if (selectedLog()) {
        <div class="grid grid-cols-2 gap-4">
          @if (selectedLog()!.oldData) {
            <div>
              <h3 class="font-semibold text-sm text-red-600 mb-2">Antes</h3>
              <pre class="text-xs bg-red-50 p-3 rounded overflow-auto max-h-64">{{
                selectedLog()!.oldData | json
              }}</pre>
            </div>
          }
          @if (selectedLog()!.newData) {
            <div>
              <h3 class="font-semibold text-sm text-green-600 mb-2">Depois</h3>
              <pre class="text-xs bg-green-50 p-3 rounded overflow-auto max-h-64">{{
                selectedLog()!.newData | json
              }}</pre>
            </div>
          }
        </div>
      }
    </p-dialog>
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly http = inject(HttpClient);

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
