import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FinancialEntry } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-entry-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, ButtonModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-lg">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/financeiro" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">Novo Lançamento</h1>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Tipo *</label>
          <p-select formControlName="type" [options]="typeOptions" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Descrição *</label>
          <input pInputText formControlName="description" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label>Valor Total *</label>
            <p-inputNumber formControlName="totalAmount" mode="currency" currency="BRL" locale="pt-BR" />
          </div>
          <div class="flex flex-col gap-1">
            <label>Vencimento *</label>
            <input pInputText formControlName="dueDate" type="date" />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label>Parcelas</label>
          <p-inputNumber formControlName="installmentCount" [min]="1" [max]="60" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Observações</label>
          <textarea pTextarea formControlName="notes" rows="2"></textarea>
        </div>
        <div class="flex gap-2 mt-2">
          <button pButton type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid"></button>
          <a routerLink="/app/financeiro" pButton class="p-button-secondary" label="Cancelar"></a>
        </div>
      </form>
    </div>
  `,
})
export class EntryFormComponent {
  private svc = inject(FinancialService);
  private router = inject(Router);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  saving = signal(false);

  typeOptions = [
    { label: 'A Receber', value: 'receivable' },
    { label: 'A Pagar', value: 'payable' },
  ];

  form = this.fb.group({
    type: ['receivable', Validators.required],
    description: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    dueDate: ['', Validators.required],
    installmentCount: [1],
    notes: [null as string | null],
  });

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<FinancialEntry> & { installmentCount?: number };
    this.svc.createEntry(dto).subscribe({
      next: () => this.router.navigate(['/app/financeiro']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
