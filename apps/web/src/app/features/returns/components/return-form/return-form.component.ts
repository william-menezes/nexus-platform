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
import { MessageService } from 'primeng/api';
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
    TextareaModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/devolucoes" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">Nova Devolução</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <p-card header="Dados da Devolução" styleClass="mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Venda *</label>
              <p-select formControlName="saleId" [options]="sales()"
                optionLabel="code" optionValue="id"
                placeholder="Selecione a venda" [filter]="true"
                filterBy="code" styleClass="w-full"
                (onChange)="onSaleSelect($event)" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Tipo *</label>
              <p-select formControlName="type" [options]="typeOptions"
                optionLabel="label" optionValue="value"
                placeholder="Tipo de devolução" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Motivo *</label>
              <input pInputText formControlName="reason"
                placeholder="Descreva o motivo da devolução" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Observações</label>
              <textarea pTextarea formControlName="notes" rows="2"
                placeholder="Observações internas..."></textarea>
            </div>
          </div>
        </p-card>

        <p-card header="Itens a Devolver" styleClass="mb-4"
          *ngIf="saleItems().length > 0">
          <div formArrayName="items">
            <div *ngFor="let si of saleItems(); let i = index"
              [formGroupName]="i"
              class="flex items-center gap-4 mb-3 p-3 bg-gray-50 rounded">
              <div class="flex-1">
                <span class="font-medium">{{ si.productName }}</span>
                <span class="text-sm text-gray-500 ml-2">
                  (máx: {{ si.quantity }})
                </span>
              </div>
              <div class="w-32 flex flex-col gap-1">
                <label class="text-xs text-gray-500">Qtd Devolver</label>
                <p-inputNumber formControlName="quantity"
                  [min]="0" [max]="si.quantity"
                  [minFractionDigits]="0" styleClass="w-full" />
              </div>
            </div>
          </div>
        </p-card>

        <div class="flex justify-end gap-2">
          <a routerLink="/app/devolucoes" pButton label="Cancelar"
            class="p-button-outlined p-button-sm"></a>
          <button pButton type="submit" label="Criar Devolução"
            icon="pi pi-check" class="p-button-sm"
            [disabled]="form.invalid || saving()"></button>
        </div>
      </form>
    </div>
  `,
})
export class ReturnFormComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

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
