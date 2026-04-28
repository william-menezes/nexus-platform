import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { Product } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';
import { InventoryService } from '../../../inventory/inventory.service';

type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';

const METHOD_OPTIONS = [
  { label: 'Dinheiro', value: 'cash' },
  { label: 'Crédito',  value: 'credit' },
  { label: 'Débito',   value: 'debit' },
  { label: 'PIX',      value: 'pix' },
  { label: 'Boleto',   value: 'boleto' },
];

@Component({
  standalone: true,
  selector: 'app-pdv',
  imports: [
    ReactiveFormsModule, RouterLink, CurrencyPipe,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule, DividerModule, MessageModule, CardModule, BreadcrumbModule,
  ],
  templateUrl: './pdv.component.html',
})
export class PdvComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(FinanceService);
  private readonly invSvc  = inject(InventoryService);
  private readonly router  = inject(Router);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Vendas', routerLink: '/app/vendas' },
    { label: 'PDV' },
  ];

  products: Product[] = [];
  productOptions: { label: string; value: string }[] = [];
  loading  = false;
  error    = '';
  readonly methodOptions = METHOD_OPTIONS;

  form = this.fb.group({
    serviceOrderId: [''],
    discountAmount: [0, Validators.min(0)],
    items:    this.fb.array([this.buildItem()]),
    payments: this.fb.array([this.buildPayment()]),
  });

  get items()    { return this.form.get('items')    as FormArray; }
  get payments() { return this.form.get('payments') as FormArray; }

  get subtotal() {
    return this.items.controls.reduce((acc, c) => {
      return acc + (c.get('unitPrice')?.value ?? 0) * (c.get('quantity')?.value ?? 0);
    }, 0);
  }
  get discount() { return this.form.get('discountAmount')?.value ?? 0; }
  get total()    { return Math.max(0, this.subtotal - this.discount); }
  get paid()     { return this.payments.controls.reduce((acc, c) => acc + (c.get('amount')?.value ?? 0), 0); }
  get remaining(){ return Math.max(0, this.total - this.paid); }

  buildItem() {
    return this.fb.group({
      productId:   [''],
      description: ['', Validators.required],
      quantity:    [1,  [Validators.required, Validators.min(1)]],
      unitPrice:   [0,  [Validators.required, Validators.min(0)]],
    });
  }

  buildPayment() {
    return this.fb.group({
      method: ['cash', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  addItem()    { this.items.push(this.buildItem()); }
  removeItem(i: number) { if (this.items.length > 1) this.items.removeAt(i); }

  addPayment()    { this.payments.push(this.buildPayment()); }
  removePayment(i: number) { if (this.payments.length > 1) this.payments.removeAt(i); }

  onProductSelect(index: number, productId: string) {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.items.at(index).patchValue({ description: product.name, unitPrice: product.salePrice });
    }
  }

  ngOnInit() {
    this.invSvc.getProducts().subscribe({
      next: (p) => {
        this.products = p;
        this.productOptions = p.map(prod => ({ label: prod.name, value: prod.id }));
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    const dto = {
      serviceOrderId: val.serviceOrderId || undefined,
      discountAmount: val.discountAmount ?? 0,
      items:    val.items ?? [],
      payments: val.payments ?? [],
    };
    this.svc.createSale(dto as never).subscribe({
      next: () => { void this.router.navigate(['/app/vendas/vendas']); },
      error: (err) => {
        this.error = err?.error?.message ?? 'Erro ao finalizar venda.';
        this.loading = false;
      },
    });
  }
}
