import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Client, Product } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';
import { InventoryService } from '../../../inventory/inventory.service';
import { ClientsService } from '../../../clients/clients.service';

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
    ReactiveFormsModule, FormsModule, RouterLink, CurrencyPipe,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule, DividerModule, MessageModule, CardModule,
    AutoCompleteModule,
  ],
  templateUrl: './pdv.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdvComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(FinanceService);
  private readonly invSvc     = inject(InventoryService);
  private readonly clientsSvc = inject(ClientsService);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() {
    this.breadcrumbSvc.set([
      { label: 'Vendas', routerLink: '/app/vendas' },
      { label: 'PDV' },
    ]);
  }

  products: Product[] = [];
  productOptions: { label: string; value: string }[] = [];
  loading        = false;
  error          = '';
  barcodeInput   = '';
  barcodeLoading = false;
  barcodeError   = '';
  readonly methodOptions = METHOD_OPTIONS;

  selectedClient: Client | null = null;
  clientSuggestions: Client[]   = [];
  private readonly clientSearch$ = new Subject<string>();

  form = this.fb.group({
    clientId:       [null as string | null],
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

  onBarcodeSearch() {
    const code = this.barcodeInput.trim();
    if (!code) return;
    this.barcodeLoading = true;
    this.barcodeError   = '';
    this.invSvc.getProductByBarcode(code).subscribe({
      next: (product) => {
        this.addItemFromProduct(product);
        this.barcodeInput   = '';
        this.barcodeLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.barcodeError   = `Código "${code}" não encontrado no estoque.`;
        this.barcodeLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onBarcodeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onBarcodeSearch();
    }
  }

  private addItemFromProduct(product: Product) {
    const existingIdx = this.items.controls.findIndex(
      c => c.get('productId')?.value === product.id,
    );
    if (existingIdx >= 0) {
      const qtyCtrl = this.items.at(existingIdx).get('quantity');
      qtyCtrl?.setValue((qtyCtrl.value ?? 1) + 1);
    } else {
      const item = this.buildItem();
      item.patchValue({ productId: product.id, description: product.name, unitPrice: product.salePrice });
      this.items.push(item);
    }
  }

  searchClients(event: AutoCompleteCompleteEvent) {
    this.clientSearch$.next(event.query);
  }

  onClientSelect(event: AutoCompleteSelectEvent) {
    const c: Client = event.value;
    this.form.patchValue({ clientId: c.id });
  }

  onClientClear() {
    this.form.patchValue({ clientId: null });
    this.selectedClient = null;
  }

  clientLabel(c: Client): string {
    return c.phone ? `${c.name} | ${c.phone}` : c.name;
  }

  ngOnInit() {
    this.clientSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.clientsSvc.getAll(query)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: list => { this.clientSuggestions = list; this.cdr.markForCheck(); },
      error: ()  => { this.clientSuggestions = []; this.cdr.markForCheck(); },
    });

    this.invSvc.getProducts().subscribe({
      next: (p) => {
        this.products = p;
        this.productOptions = p.map(prod => ({ label: prod.name, value: prod.id }));
        this.cdr.markForCheck();
      },
    });

    const clientId = this.route.snapshot.queryParamMap.get('clientId');
    if (clientId) {
      this.clientsSvc.getOne(clientId).subscribe({
        next: (c) => {
          this.selectedClient = c;
          this.form.patchValue({ clientId: c.id });
          this.cdr.markForCheck();
        },
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    const dto = {
      clientId:       val.clientId       || undefined,
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
        this.cdr.markForCheck();
      },
    });
  }
}
