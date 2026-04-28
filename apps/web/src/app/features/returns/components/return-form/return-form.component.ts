import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { ReturnsService } from '../../returns.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface SaleOption { id: string; code: string; }
interface SaleItemOption { id: string; productId: string; productName: string; quantity: number; unitPrice: number; }

@Component({
  standalone: true,
  selector: 'app-return-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule,
    TextareaModule, CardModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './return-form.component.html',
})
export class ReturnFormComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Devoluções', routerLink: '/app/devolucoes' },
    { label: 'Nova Devolução' },
  ];

  readonly sales = signal<SaleOption[]>([]);
  readonly saleItems = signal<SaleItemOption[]>([]);
  readonly saving = signal(false);

  readonly typeOptions = [
    { label: 'Estorno em Dinheiro', value: 'refund' },
    { label: 'Crédito para o Cliente', value: 'credit' },
    { label: 'Troca de Produto', value: 'exchange' },
  ];

  readonly form = this.fb.group({
    saleId: ['', Validators.required],
    type:   ['refund', Validators.required],
    reason: ['', Validators.required],
    notes:  [''],
    items:  this.fb.array([]),
  });

  get itemsArray() { return this.form.get('items') as FormArray; }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/sales`).subscribe(
      s => this.sales.set(s.map(x => ({ id: x.id, code: x.code || x.id }))),
    );
  }

  onSaleSelect(event: any) {
    const saleId = event.value;
    if (!saleId) return;
    this.http.get<any>(`${environment.apiUrl}/sales/${saleId}`).subscribe(sale => {
      const items: SaleItemOption[] = (sale.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.name || i.description || i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));
      this.saleItems.set(items);
      this.itemsArray.clear();
      items.forEach(si => {
        this.itemsArray.push(this.fb.group({
          saleItemId: [si.id],
          quantity: [0, [Validators.min(0), Validators.max(si.quantity)]],
        }));
      });
    });
  }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const itemsToReturn = (raw.items as any[]).filter(i => i.quantity > 0);
    if (itemsToReturn.length === 0) {
      this.msg.add({ severity: 'warn', summary: 'Informe ao menos 1 item para devolver' });
      return;
    }

    this.saving.set(true);
    const payload: any = {
      saleId: raw.saleId,
      type: raw.type,
      reason: raw.reason,
      notes: raw.notes || undefined,
      items: itemsToReturn,
    };

    this.svc.create(payload).subscribe({
      next: (r) => {
        this.msg.add({ severity: 'success', summary: 'Devolução criada', detail: r.code });
        this.router.navigate(['/app/devolucoes', r.id]);
      },
      error: (err) => {
        this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
