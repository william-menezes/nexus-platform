import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Contract, ContractBilling } from '@nexus-platform/shared-types';
import { ContractsService } from '../../contracts.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', active: 'Ativo', suspended: 'Suspenso',
  cancelled: 'Cancelado', expired: 'Expirado',
};
const STATUS_SEVERITY: Record<string, string> = {
  draft: 'secondary', active: 'success', suspended: 'warn',
  cancelled: 'danger', expired: 'secondary',
};
const BILLING_STATUS: Record<string, string> = {
  pending: 'Pendente', billed: 'Faturado', paid: 'Pago', cancelled: 'Cancelado',
};

@Component({
  standalone: true,
  selector: 'app-contract-detail',
  imports: [
    CommonModule, RouterLink,
    ButtonModule, TagModule, CardModule, TableModule,
    ToastModule, ConfirmDialogModule, DividerModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page max-w-4xl mx-auto" *ngIf="contract(); else loading">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/contratos" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">{{ contract()!.code }}</h1>
        <p-tag [value]="statusLabel(contract()!.status)"
          [severity]="statusSeverity(contract()!.status)" />
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button pButton label="Ativar" icon="pi pi-play" class="p-button-sm p-button-success"
          *ngIf="contract()!.status === 'draft'"
          (click)="doActivate()"></button>
        <button pButton label="Suspender" icon="pi pi-pause" class="p-button-sm p-button-warn"
          *ngIf="contract()!.status === 'active'"
          (click)="doSuspend()"></button>
        <button pButton label="Cancelar" icon="pi pi-times" class="p-button-sm p-button-danger"
          *ngIf="!['cancelled','expired'].includes(contract()!.status)"
          (click)="confirmCancel()"></button>
        <button pButton label="Gerar Fatura" icon="pi pi-dollar" class="p-button-sm"
          *ngIf="contract()!.status === 'active'"
          (click)="doBill()"></button>
        <a [routerLink]="[contract()!.id, 'editar']" pButton label="Editar"
          icon="pi pi-pencil" class="p-button-sm p-button-outlined"
          *ngIf="contract()!.status === 'draft'"></a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <p-card header="Dados do Contrato">
          <div class="text-sm flex flex-col gap-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Cliente</span>
              <span class="font-medium">{{ contract()!.clientName || contract()!.clientId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Tipo</span>
              <span>{{ contract()!.type === 'fixed' ? 'Mensal Fixo' : 'Franquia de Horas' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Início</span>
              <span>{{ contract()!.startDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="contract()!.endDate">
              <span class="text-gray-500">Término</span>
              <span>{{ contract()!.endDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Dia Faturamento</span>
              <span>Dia {{ contract()!.billingDay }}</span>
            </div>
            <div class="flex justify-between" *ngIf="contract()!.nextBillingAt">
              <span class="text-gray-500">Próximo Faturamento</span>
              <span>{{ contract()!.nextBillingAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="contract()!.adjustmentRate">
              <span class="text-gray-500">Reajuste Anual</span>
              <span>{{ contract()!.adjustmentRate }}%</span>
            </div>
          </div>
        </p-card>

        <p-card header="Valores">
          <div class="text-sm flex flex-col gap-2" *ngIf="contract()!.type === 'fixed'">
            <div class="flex justify-between text-base font-bold">
              <span>Mensalidade</span>
              <span>{{ contract()!.monthlyValue | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>
          <div class="text-sm flex flex-col gap-2" *ngIf="contract()!.type === 'hourly_franchise'">
            <div class="flex justify-between">
              <span class="text-gray-500">Horas Franquia</span>
              <span class="font-medium">{{ contract()!.franchiseHours }}h / mês</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Hora Excedente</span>
              <span class="font-medium">{{ contract()!.hourExcessPrice | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>
          <p-divider *ngIf="contract()!.description" />
          <p class="text-sm text-gray-600" *ngIf="contract()!.description">
            {{ contract()!.description }}
          </p>
          <p class="text-sm text-gray-500 mt-2" *ngIf="contract()!.notes">
            <em>{{ contract()!.notes }}</em>
          </p>
        </p-card>
      </div>

      <!-- Billing history -->
      <p-card header="Histórico de Faturamento">
        <p-table [value]="billing()" [loading]="loadingBilling()" stripedRows>
          <ng-template pTemplate="header">
            <tr>
              <th>Período</th>
              <th class="text-right">Base</th>
              <th class="text-right">Horas Exc.</th>
              <th class="text-right">Excedente</th>
              <th class="text-right">Total</th>
              <th>Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-b>
            <tr>
              <td>{{ b.periodStart | date:'MM/yyyy' }}</td>
              <td class="text-right">{{ b.baseAmount | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td class="text-right">{{ b.excessHours || 0 }}h</td>
              <td class="text-right">{{ b.excessAmount | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td class="text-right font-medium">{{ b.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ billingStatusLabel(b.status) }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center text-gray-500 py-6">
                Nenhum faturamento gerado.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <ng-template #loading>
      <div class="nx-page flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
      </div>
    </ng-template>
  `,
})
export class ContractDetailComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly contract = signal<Contract | null>(null);
  readonly billing = signal<ContractBilling[]>([]);
  readonly loadingBilling = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
    this.loadBilling(id);
  }

  load(id: string) {
    this.svc.findOne(id).subscribe(c => this.contract.set(c));
  }

  loadBilling(id: string) {
    this.loadingBilling.set(true);
    this.svc.findBilling(id).subscribe({
      next: b => { this.billing.set(b); this.loadingBilling.set(false); },
      error: () => { this.loadingBilling.set(false); },
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  billingStatusLabel(s: string) { return BILLING_STATUS[s] ?? s; }

  doActivate() {
    const id = this.contract()!.id;
    this.svc.activate(id).subscribe({
      next: c => { this.contract.set(c); this.msg.add({ severity: 'success', summary: 'Contrato ativado' }); },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
    });
  }

  doSuspend() {
    const id = this.contract()!.id;
    this.svc.suspend(id).subscribe({
      next: c => { this.contract.set(c); this.msg.add({ severity: 'success', summary: 'Contrato suspenso' }); },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
    });
  }

  confirmCancel() {
    this.confirm.confirm({
      message: 'Cancelar este contrato? Esta ação não pode ser desfeita.',
      header: 'Confirmar Cancelamento',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const id = this.contract()!.id;
        this.svc.cancel(id).subscribe({
          next: c => { this.contract.set(c); this.msg.add({ severity: 'info', summary: 'Contrato cancelado' }); },
          error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
        });
      },
    });
  }

  doBill() {
    const id = this.contract()!.id;
    this.svc.generateBilling(id).subscribe({
      next: (b) => {
        this.billing.update(list => [b, ...list]);
        this.svc.findOne(id).subscribe(c => this.contract.set(c));
        this.msg.add({ severity: 'success', summary: 'Fatura gerada' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
    });
  }
}
