import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
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
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page max-w-4xl mx-auto" *ngIf="ret(); else loading">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/devolucoes" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">{{ ret()!.code }}</h1>
        <p-tag [value]="statusLabel(ret()!.status)" [severity]="statusSeverity(ret()!.status)" />
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mb-4 flex-wrap" *ngIf="ret()!.status === 'pending'">
        <button pButton label="Aprovar" icon="pi pi-check" class="p-button-sm p-button-success"
          (click)="doApprove()"></button>
        <button pButton label="Rejeitar" icon="pi pi-times" class="p-button-sm p-button-danger"
          (click)="doReject()"></button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <p-card header="Informações da Devolução">
          <div class="text-sm flex flex-col gap-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Venda</span>
              <span class="font-medium">{{ ret()!.saleCode || ret()!.saleId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Tipo</span>
              <span>{{ typeLabel(ret()!.type) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Motivo</span>
              <span>{{ ret()!.reason }}</span>
            </div>
            <div class="flex justify-between" *ngIf="ret()!.notes">
              <span class="text-gray-500">Obs.</span>
              <span>{{ ret()!.notes }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Data</span>
              <span>{{ ret()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
        </p-card>

        <p-card header="Valores">
          <div class="text-sm flex flex-col gap-2">
            <div class="flex justify-between font-bold text-base">
              <span>Total Devolução</span>
              <span>{{ ret()!.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="ret()!.refundAmount">
              <span class="text-gray-500">Estorno</span>
              <span>{{ ret()!.refundAmount | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="ret()!.creditAmount">
              <span class="text-gray-500">Crédito</span>
              <span>{{ ret()!.creditAmount | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Items -->
      <p-card header="Itens Devolvidos">
        <p-table [value]="ret()!.items" stripedRows>
          <ng-template pTemplate="header">
            <tr>
              <th>Produto</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">Preço Unit.</th>
              <th class="text-right">Total</th>
              <th>Estoque</th>
              <th *ngIf="ret()!.status === 'approved'">Ação</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.productName || item.productId || '—' }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">{{ item.unitPrice | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td class="text-right">{{ item.totalPrice | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <p-tag
                  [value]="item.stockReturned ? 'Devolvido' : 'Pendente'"
                  [severity]="item.stockReturned ? 'success' : 'warn'" />
              </td>
              <td *ngIf="ret()!.status === 'approved'">
                <button pButton label="Retornar ao Estoque"
                  icon="pi pi-box" class="p-button-sm p-button-outlined"
                  *ngIf="!item.stockReturned"
                  (click)="doReturnToStock(item.id)"></button>
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
export class ReturnDetailComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly ret = signal<Return | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  load(id: string) {
    this.svc.findOne(id).subscribe(r => this.ret.set(r));
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
