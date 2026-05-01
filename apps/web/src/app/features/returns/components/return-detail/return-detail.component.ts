import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Return } from '@nexus-platform/shared-types';
import { ReturnsService } from '../../returns.service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovada',
  completed: 'Concluída', rejected: 'Rejeitada',
};
const STATUS_SEVERITY: Record<string, string> = {
  pending: 'warn', approved: 'info',
  completed: 'success', rejected: 'danger',
};
const TYPE_LABELS: Record<string, string> = {
  refund: 'Estorno em Dinheiro', credit: 'Crédito para o Cliente', exchange: 'Troca de Produto',
};

@Component({
  standalone: true,
  selector: 'app-return-detail',
  imports: [
    CommonModule, RouterLink,
    ButtonModule, TagModule, CardModule, TableModule,
    ToastModule, ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './return-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnDetailComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly ret = signal<Return | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  load(id: string) {
    this.svc.findOne(id).subscribe(r => {
      this.ret.set(r);
      this.breadcrumbSvc.set([
        { label: 'Devoluções', routerLink: '/app/vendas/devolucoes' },
        { label: r.code },
      ]);
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }

  doApprove() {
    this.svc.approve(this.ret()!.id).subscribe({
      next: r => { this.ret.set(r); this.msg.add({ severity: 'success', summary: 'Devolução aprovada' }); },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
    });
  }

  doReject() {
    this.confirm.confirm({
      message: 'Rejeitar esta devolução?',
      header: 'Confirmar Rejeição',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.reject(this.ret()!.id).subscribe({
          next: r => { this.ret.set(r); this.msg.add({ severity: 'info', summary: 'Devolução rejeitada' }); },
          error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
        });
      },
    });
  }

  doReturnToStock(itemId: string) {
    this.svc.returnToStock(this.ret()!.id, itemId).subscribe({
      next: r => {
        this.ret.set(r);
        this.msg.add({ severity: 'success', summary: 'Item retornado ao estoque' });
      },
      error: (err) => this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message }),
    });
  }
}
