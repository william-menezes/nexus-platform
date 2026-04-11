import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PurchaseOrdersService } from '../../purchase-orders.service';
import { SuppliersService } from '../../../suppliers/suppliers.service';
import { Supplier } from '@nexus-platform/shared-types';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface ProductOption {
  id: string;
  name: string;
  sku?: string;
  costPrice: number;
}

@Component({
  standalone: true,
  selector: 'app-purchase-order-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, DatePickerModule,
    SelectModule, TextareaModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/compras" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">Novo Pedido de Compra</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <p-card header="Dados do Pedido" styleClass="mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Fornecedor *</label>
              <p-select formControlName="supplierId" [options]="suppliers()"
                optionLabel="name" optionValue="id"
                placeholder="Selecione o fornecedor" [filter]="true"
                filterBy="name" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Previsão de Entrega</label>
              <p-datepicker formControlName="expectedAt" dateFormat="dd/mm/yy"
                [showIcon]="true" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Nº NF do Fornecedor</label>
              <input pInputText formControlName="nfeNumber" placeholder="000000" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Desconto (R$)</label>
              <p-inputNumber formControlName="discount" mode="currency" currency="BRL"
                locale="pt-BR" [minFractionDigits]="2" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Frete (R$)</label>
              <p-inputNumber formControlName="shippingCost" mode="currency" currency="BRL"
                locale="pt-BR" [minFractionDigits]="2" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Observações</label>
              <textarea pTextarea formControlName="notes" rows="2"
                placeholder="Observações sobre o pedido..."></textarea>
            </div>
          </div>
        </p-card>

        <p-card header="Itens do Pedido" styleClass="mb-4">
          <div formArrayName="items">
            <div *ngFor="let item of itemsArray.controls; let i = index"
              [formGroupName]="i"
              class="grid grid-cols-12 gap-2 items-end mb-3 p-3 bg-gray-50 rounded">

              <div class="col-span-12 md:col-span-5 flex flex-col gap-1">
                <label class="text-sm font-medium">Produto *</label>
                <p-select formControlName="productId" [options]="products()"
                  optionLabel="name" optionValue="id"
                  placeholder="Selecione o produto" [filter]="true"
                  filterBy="name" styleClass="w-full"
                  (onChange)="onProductSelect(i, $event)" />
              </div>

              <div class="col-span-4 md:col-span-2 flex flex-col gap-1">
                <label class="text-sm font-medium">Qtd *</label>
                <p-inputNumber formControlName="quantity" [min]="0.001"
                  [minFractionDigits]="0" [maxFractionDigits]="3" styleClass="w-full"
                  (onInput)="recalc()" />
              </div>

              <div class="col-span-5 md:col-span-3 flex flex-col gap-1">
                <label class="text-sm font-medium">Custo unit. *</label>
                <p-inputNumber formControlName="unitCost" mode="currency" currency="BRL"
                  locale="pt-BR" [minFractionDigits]="2" styleClass="w-full"
                  (onInput)="recalc()" />
              </div>

              <div class="col-span-10 md:col-span-1 flex flex-col gap-1">
                <label class="text-sm font-medium">Total</label>
                <span class="font-medium py-2">
                  {{ itemTotal(i) | currency:'BRL':'symbol':'1.2-2' }}
                </span>
              </div>

              <div class="col-span-2 md:col-span-1 flex items-end">
                <button type="button" pButton icon="pi pi-trash"
                  class="p-button-text p-button-danger p-button-sm"
                  (click)="removeItem(i)"></button>
              </div>
            </div>
          </div>

          <button type="button" pButton icon="pi pi-plus" label="Adicionar Item"
            class="p-button-outlined p-button-sm" (click)="addItem()"></button>

          <div class="mt-4 flex flex-col items-end gap-1 text-sm">
            <div class="flex gap-4">
              <span class="text-gray-500">Subtotal:</span>
              <span class="font-medium">{{ subtotal() | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex gap-4 text-red-500" *ngIf="form.get('discount')?.value">
              <span>Desconto:</span>
              <span>- {{ form.get('discount')?.value | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex gap-4" *ngIf="form.get('shippingCost')?.value">
              <span class="text-gray-500">Frete:</span>
              <span class="font-medium">{{ form.get('shippingCost')?.value | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex gap-4 text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{{ total() | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        </p-card>

        <div class="flex justify-end gap-2">
          <a routerLink="/app/compras" pButton label="Cancelar"
            class="p-button-outlined p-button-sm"></a>
          <button pButton type="submit" label="Criar Pedido"
            icon="pi pi-check" class="p-button-sm"
            [disabled]="form.invalid || saving() || itemsArray.length === 0"></button>
        </div>
      </form>
    </div>
  `,
})
export class PurchaseOrderFormComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly suppliersSvc = inject(SuppliersService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly suppliers = signal<Supplier[]>([]);
  readonly products = signal<ProductOption[]>([]);
  readonly saving = signal(false);

  readonly subtotal = signal(0);
  readonly total = signal(0);

  readonly form = this.fb.group({
    supplierId: ['', Validators.required],
    expectedAt: [null as Date | null],
    discount: [0],
    shippingCost: [0],
    nfeNumber: [''],
    notes: [''],
    items: this.fb.array([]),
  });

  get itemsArray() { return this.form.get('items') as FormArray; }

  ngOnInit() {
    this.suppliersSvc.findAll().subscribe(s => this.suppliers.set(s));
    this.http.get<ProductOption[]>(`${environment.apiUrl}/inventory/products`).subscribe(
      p => this.products.set(p),
    );
  }

  addItem() {
    this.itemsArray.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
    }));
  }

  removeItem(i: number) {
    this.itemsArray.removeAt(i);
    this.recalc();
  }

  onProductSelect(i: number, event: any) {
    const product = this.products().find(p => p.id === event.value);
    if (product) {
      this.itemsArray.at(i).patchValue({ unitCost: product.costPrice });
      this.recalc();
    }
  }

  itemTotal(i: number): number {
    const ctrl = this.itemsArray.at(i);
    const qty = ctrl.get('quantity')?.value ?? 0;
    const cost = ctrl.get('unitCost')?.value ?? 0;
    return qty * cost;
  }

  recalc() {
    let sub = 0;
    for (let i = 0; i < this.itemsArray.length; i++) {
      sub += this.itemTotal(i);
    }
    this.subtotal.set(sub);
    const disc = this.form.get('discount')?.value ?? 0;
    const ship = this.form.get('shippingCost')?.value ?? 0;
    this.total.set(sub - disc + ship);
  }

  save() {
    if (this.form.invalid || this.itemsArray.length === 0) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: any = {
      supplierId: raw.supplierId,
      discount: raw.discount ?? 0,
      shippingCost: raw.shippingCost ?? 0,
      nfeNumber: raw.nfeNumber || undefined,
      notes: raw.notes || undefined,
      expectedAt: raw.expectedAt ? (raw.expectedAt as Date).toISOString().split('T')[0] : undefined,
      items: (raw.items as any[]).map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitCost: i.unitCost,
      })),
    };

    this.svc.create(payload).subscribe({
      next: (po) => {
        this.msg.add({ severity: 'success', summary: 'Pedido criado', detail: po.code });
        this.router.navigate(['/app/compras', po.id]);
      },
      error: (err) => {
        this.msg.add({ severity: 'error', summary: 'Erro ao criar', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
