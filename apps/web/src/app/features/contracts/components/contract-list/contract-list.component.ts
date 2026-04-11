import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Contract } from '@nexus-platform/shared-types';
import { ContractsService } from '../../contracts.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', active: 'Ativo', suspended: 'Suspenso',
  cancelled: 'Cancelado', expired: 'Expirado',
};
const STATUS_SEVERITY: Record<string, string> = {
  draft: 'secondary', active: 'success', suspended: 'warn',
  cancelled: 'danger', expired: 'secondary',
};
const TYPE_LABELS: Record<string, string> = {
  fixed: 'Mensal Fixo',
  hourly_franchise: 'Franquia de Horas',
};

@Component({
  standalone: true,
  selector: 'app-contract-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, SelectModule, TagModule,
    ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Contratos</h1>
        <a routerLink="novo" pButton label="Novo Contrato" icon="pi pi-plus" class="p-button-sm"></a>
      </div>

      <div class="mb-3">
        <p-select [options]="statusOptions" [(ngModel)]="statusFilter"
          optionLabel="label" optionValue="value"
          placeholder="Todos os status" [showClear]="true"
          (onChange)="load()" styleClass="w-48" />
      </div>

      <p-table [value]="contracts()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Valor Mensal</th>
            <th>Próximo Faturamento</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-c>
          <tr>
            <td>
              <a [routerLink]="[c.id]" class="text-primary font-medium hover:underline">
                {{ c.code }}
              </a>
            </td>
            <td>{{ c.client?.name || c.clientId }}</td>
            <td>{{ typeLabel(c.type) }}</td>
            <td><p-tag [value]="statusLabel(c.status)" [severity]="statusSeverity(c.status)" /></td>
            <td>
              <ng-container *ngIf="c.type === 'fixed'">
                {{ c.monthlyValue | currency:'BRL':'symbol':'1.2-2' }}
              </ng-container>
              <ng-container *ngIf="c.type === 'hourly_franchise'">
                {{ c.franchiseHours }}h / mês
              </ng-container>
            </td>
            <td>{{ c.nextBillingAt ? (c.nextBillingAt | date:'dd/MM/yyyy') : '—' }}</td>
            <td>
              <a [routerLink]="[c.id]" pButton icon="pi pi-eye"
                class="p-button-sm p-button-text mr-1" aria-label="Ver detalhes"></a>
              <a [routerLink]="[c.id, 'editar']" pButton icon="pi pi-pencil"
                class="p-button-sm p-button-text mr-1" aria-label="Editar"
                *ngIf="c.status === 'draft'"></a>
              <button pButton icon="pi pi-trash"
                class="p-button-sm p-button-text p-button-danger"
                *ngIf="c.status === 'draft'"
                (click)="confirmDelete(c)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center text-gray-500 py-8">
              Nenhum contrato encontrado.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class ContractListComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly contracts = signal<Contract[]>([]);
  readonly loading = signal(false);
  statusFilter: string | null = null;

  readonly statusOptions = [
    { label: 'Rascunho',  value: 'draft' },
    { label: 'Ativo',     value: 'active' },
    { label: 'Suspenso',  value: 'suspended' },
    { label: 'Cancelado', value: 'cancelled' },
    { label: 'Expirado',  value: 'expired' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.statusFilter ?? undefined).subscribe({
      next: data => { this.contracts.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }

  confirmDelete(c: Contract) {
    this.confirm.confirm({
      message: `Excluir contrato "${c.code}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(c.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: c.code });
            this.load();
          },
          error: (err) => this.msg.add({
            severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message,
          }),
        });
      },
    });
  }
}
