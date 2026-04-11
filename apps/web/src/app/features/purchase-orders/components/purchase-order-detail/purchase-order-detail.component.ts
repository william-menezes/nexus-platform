import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { PurchaseOrder, PurchaseItem, ReceivePurchaseOrderPayload } from '@nexus-platform/shared-types';
import { PurchaseOrdersService } from '../../purchase-orders.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', sent: 'Enviado', partial: 'Parcial',
  received: 'Recebido', cancelled: 'Cancelado',
};
const STATUS_SEVERITY: Record<string, string> = {
  draft: 'secondary', sent: 'info', partial: 'warn',
  received: 'success', cancelled: 'danger',
};

@Component({
  standalone: true,
  selector: 'app-purchase-order-detail',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputNumberModule, TagModule, CardModule,
    TableModule, ToastModule, DividerModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-4xl mx-auto" *ngIf="po(); else loading">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/compras" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">{{ po()!.code }}</h1>
        <p-tag [value]="statusLabel(po()!.status)" [severity]="statusSeverity(po()!.status)" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <p-card header="Informações">
          <div class="text-sm flex flex-col gap-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Fornecedor</span>
              <span class="font-medium">{{ po()!.supplierName || po()!.supplierId }}</span>
            </div>
            <div class="flex justify-between" *ngIf="po()!.expectedAt">
              <span class="text-gray-500">Previsão</span>
              <span>{{ po()!.expectedAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="po()!.receivedAt">
              <span class="text-gray-500">Recebido em</span>
              <span>{{ po()!.receivedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="po()!.nfeNumber">
              <span class="text-gray-500">NF Fornecedor</span>
              <span>{{ po()!.nfeNumber }}</span>
            </div>
            <div class="flex justify-between" *ngIf="po()!.notes">
              <span class="text-gray-500">Obs.</span>
              <span>{{ po()!.notes }}</span>
            </div>
          </div>
        </p-card>

        <p-card header="Valores">
          <div class="text-sm flex flex-col gap-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Subtotal</span>
              <span>{{ po()!.subtotal | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="po()!.discount">
              <span class="text-gray-500">Desconto</span>
              <span class="text-red-500">- {{ po()!.discount | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="po()!.shippingCost">
              <span class="text-gray-500">Frete</span>
              <span>{{ po()!.shippingCost | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <p-divider />
            <div class="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{{ po()!.total | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Items table -->
      <p-card header="Itens" styleClass="mb-4">
        <p-table [value]="po()!.items" stripedRows>
          <ng-template pTemplate="header">
            <tr>
              <th>Produto</th>
              <th class="text-right">Qtd Pedida</th>
              <th class="text-right">Qtd Recebida</th>
              <th class="text-right">Custo Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.productName || item.productId }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">{{ item.quantityReceived }}</td>
              <td class="text-right">{{ item.unitCost | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td class="text-right">{{ item.totalCost | currency:'BRL':'symbol':'1.2-2' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Receive form -->
      <p-card header="Registrar Recebimento" styleClass="mb-4"
        *ngIf="canReceive(po()!.status)">
        <form [formGroup]="receiveForm" (ngSubmit)="submitReceive()">
          <div formArrayName="items">
            <div *ngFor="let item of po()!.items; let i = index"
              [formGroupName]="i"
              class="flex items-center gap-4 mb-3 p-3 bg-gray-50 rounded">
              <div class="flex-1">
                <span class="font-medium">{{ item.productName || item.productId }}</span>
                <span class="text-sm text-gray-500 ml-2">
                  (pedido: {{ item.quantity }} | recebido: {{ item.quantityReceived }})
                </span>
              </div>
              <div class="w-40 flex flex-col gap-1">
                <label class="text-xs text-gray-500">Qtd a receber</label>
                <p-inputNumber formControlName="quantityReceived"
                  [min]="0" [max]="remaining(item)"
                  [minFractionDigits]="0" [maxFractionDigits]="3"
                  styleClass="w-full" />
              </div>
            </div>
          </div>
          <div class="flex justify-end mt-3">
            <button pButton type="submit" label="Confirmar Recebimento"
              icon="pi pi-check" class="p-button-sm p-button-success"
              [disabled]="receiving()"></button>
          </div>
        </form>
      </p-card>
    </div>

    <ng-template #loading>
      <div class="nx-page flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
      </div>
    </ng-template>
  `,
})
export class PurchaseOrderDetailComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly po = signal<PurchaseOrder | null>(null);
  readonly receiving = signal(false);

  readonly receiveForm = this.fb.group({ items: this.fb.array([]) });
  get receiveItems() { return this.receiveForm.get('items') as FormArray; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  load(id: string) {
    this.svc.findOne(id).subscribe(po => {
      this.po.set(po);
      this.buildReceiveForm(po.items);
    });
  }

  buildReceiveForm(items: PurchaseItem[]) {
    this.receiveItems.clear();
    items.forEach(item => {
      this.receiveItems.push(this.fb.group({
        purchaseItemId: [item.id],
        quantityReceived: [0, [Validators.min(0), Validators.max(this.remaining(item))]],
      }));
    });
  }

  remaining(item: PurchaseItem): number {
    return Math.max(0, Number(item.quantity) - Number(item.quantityReceived));
  }

  canReceive(status: string) { return !['received', 'cancelled'].includes(status); }
  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }

  submitReceive() {
    const po = this.po();
    if (!po) return;
    const raw = this.receiveForm.getRawValue();
    const items = (raw.items as any[])
      .filter(i => i.quantityReceived > 0)
      .map(i => ({ purchaseItemId: i.purchaseItemId, quantityReceived: i.quantityReceived }));

    if (items.length === 0) {
      this.msg.add({ severity: 'warn', summary: 'Informe pelo menos uma quantidade' });
      return;
    }

    this.receiving.set(true);
    const payload: ReceivePurchaseOrderPayload = { items };
    this.svc.receive(po.id, payload).subscribe({
      next: (updated) => {
        this.po.set(updated);
        this.buildReceiveForm(updated.items);
        this.receiving.set(false);
        this.msg.add({ severity: 'success', summary: 'Recebimento registrado' });
      },
      error: (err) => {
        this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message });
        this.receiving.set(false);
      },
    });
  }
}
