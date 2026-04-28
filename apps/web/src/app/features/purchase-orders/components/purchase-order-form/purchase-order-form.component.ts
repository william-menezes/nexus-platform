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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
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
    SelectModule, TextareaModule, CardModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './purchase-order-form.component.html',
})
export class PurchaseOrderFormComponent implements OnInit {
  private readonly svc = inject(PurchaseOrdersService);
  private readonly suppliersSvc = inject(SuppliersService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Pedidos de Compra', routerLink: '/app/compras' },
    { label: 'Novo Pedido' },
  ];

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
