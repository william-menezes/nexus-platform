import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';

const ITEM_TYPES = [
  { label: 'Produto', value: 'product' },
  { label: 'Serviço', value: 'service' },
];

@Component({
  standalone: true,
  selector: 'app-quote-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, ButtonModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-3xl">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/orcamentos" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">{{ isEdit ? 'Editar Orçamento' : 'Novo Orçamento' }}</h1>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label>ID do Cliente *</label>
            <input pInputText formControlName="clientId" placeholder="UUID do cliente" />
          </div>
          <div class="flex flex-col gap-1">
            <label>Válido até</label>
            <input pInputText formControlName="validUntil" type="date" />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label>Descrição</label>
          <textarea pTextarea formControlName="description" rows="2"></textarea>
        </div>

        <!-- Items -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex justify-between items-center mb-3">
            <h2 class="font-semibold">Itens</h2>
            <button type="button" pButton label="Adicionar Item" icon="pi pi-plus" class="p-button-sm p-button-secondary" (click)="addItem()"></button>
          </div>
          <div formArrayName="items" class="flex flex-col gap-3">
            @for (item of itemsArray.controls; track $index) {
              <div [formGroupName]="$index" class="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded border">
                <div class="col-span-3 flex flex-col gap-1">
                  <label class="text-xs">Tipo</label>
                  <p-select formControlName="itemType" [options]="itemTypes" optionLabel="label" optionValue="value" />
                </div>
                <div class="col-span-4 flex flex-col gap-1">
                  <label class="text-xs">Descrição *</label>
                  <input pInputText formControlName="description" />
                </div>
                <div class="col-span-2 flex flex-col gap-1">
                  <label class="text-xs">Qtd</label>
                  <p-inputNumber formControlName="quantity" [min]="0.001" [minFractionDigits]="0" [maxFractionDigits]="3" />
                </div>
                <div class="col-span-2 flex flex-col gap-1">
                  <label class="text-xs">Preço Unit.</label>
                  <p-inputNumber formControlName="unitPrice" mode="currency" currency="BRL" locale="pt-BR" />
                </div>
                <div class="col-span-1 flex justify-end">
                  <button type="button" pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="removeItem($index)"></button>
                </div>
              </div>
            }
            @if (itemsArray.length === 0) {
              <p class="text-gray-400 text-sm text-center py-4">Nenhum item adicionado</p>
            }
          </div>
        </div>

        <div class="flex flex-col gap-1 max-w-xs">
          <label>Desconto Total (R$)</label>
          <p-inputNumber formControlName="discountAmount" mode="currency" currency="BRL" locale="pt-BR" />
        </div>

        <div class="flex gap-2 mt-2">
          <button pButton type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid"></button>
          <a routerLink="/app/orcamentos" pButton class="p-button-secondary" label="Cancelar"></a>
        </div>
      </form>
    </div>
  `,
})
export class QuoteFormComponent implements OnInit {
  private svc = inject(QuotesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  isEdit = false;
  editId = '';
  saving = signal(false);
  itemTypes = ITEM_TYPES;

  form = this.fb.group({
    clientId: ['', Validators.required],
    description: [null as string | null],
    validUntil: [null as string | null],
    discountAmount: [0],
    items: this.fb.array([]),
  });

  get itemsArray() { return this.form.get('items') as FormArray; }

  ngOnInit() {
    this.editId = this.route.snapshot.params['id'];
    if (this.editId) {
      this.isEdit = true;
      this.svc.getOne(this.editId).subscribe(q => {
        this.form.patchValue({
          clientId: q.clientId,
          description: q.description ?? null,
          validUntil: q.validUntil ?? null,
          discountAmount: q.discountAmount,
        });
        (q.items ?? []).forEach(item => {
          this.itemsArray.push(this.buildItemGroup({
            itemType: item.itemType,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }));
        });
      });
    }
  }

  addItem() {
    this.itemsArray.push(this.buildItemGroup());
  }

  removeItem(i: number) {
    this.itemsArray.removeAt(i);
  }

  private buildItemGroup(defaults?: { itemType?: string; description?: string; quantity?: number; unitPrice?: number }) {
    return this.fb.group({
      itemType: [defaults?.itemType ?? 'product'],
      description: [defaults?.description ?? '', Validators.required],
      quantity: [defaults?.quantity ?? 1],
      unitPrice: [defaults?.unitPrice ?? 0],
      discount: [0],
      sortOrder: [0],
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null)
    ) as Partial<Quote>;
    const req = this.isEdit ? this.svc.update(this.editId, dto) : this.svc.create(dto);
    req.subscribe({
      next: q => this.router.navigate(['/app/orcamentos', q.id]),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
