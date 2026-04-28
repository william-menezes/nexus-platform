import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
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
    TableModule, ToastModule, DividerModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './purchase-order-detail.component.html',
})
export class PurchaseOrderDetailComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Pedidos de Compra', routerLink: '/app/compras' },
      { label: this.po()?.code ?? '...' },
    ];
  }

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
