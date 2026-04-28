import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
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
    ToastModule, ConfirmDialogModule, DividerModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './contract-detail.component.html',
})
export class ContractDetailComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly contract = signal<Contract | null>(null);
  readonly billing = signal<ContractBilling[]>([]);
  readonly loadingBilling = signal(false);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs = computed<MenuItem[]>(() => [
    { label: 'Contratos', routerLink: '/app/contratos' },
    { label: this.contract()?.code ?? '...' },
  ]);

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
