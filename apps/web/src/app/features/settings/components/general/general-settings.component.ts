import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../settings.service';

@Component({
  standalone: true,
  selector: 'app-general-settings',
  imports: [
    CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule,
    InputNumberModule, SelectModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-card header="Configurações Gerais">
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Prefixo OS</label>
            <input pInputText formControlName="osCodePrefix" placeholder="OS" />
            <small class="text-gray-500">Ex: OS-000001</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Prefixo Orçamento</label>
            <input pInputText formControlName="quoteCodePrefix" placeholder="ORC" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Prefixo Venda</label>
            <input pInputText formControlName="saleCodePrefix" placeholder="VND" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Validade do Orçamento (dias)</label>
            <p-inputNumber formControlName="quoteValidityDays" [min]="1" [max]="365" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Garantia Padrão (dias)</label>
            <p-inputNumber formControlName="warrantyDays" [min]="0" [max]="3650" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Moeda</label>
            <p-select formControlName="currency" [options]="currencies"
              optionLabel="label" optionValue="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Fuso Horário</label>
            <p-select formControlName="timezone" [options]="timezones"
              optionLabel="label" optionValue="value" />
          </div>
        </div>

        <div class="flex justify-end">
          <button pButton type="submit" label="Salvar" icon="pi pi-check"
            class="p-button-sm" [disabled]="form.invalid || saving()"></button>
        </div>
      </form>
    </p-card>
  `,
})
export class GeneralSettingsComponent implements OnInit {
  private readonly svc = inject(SettingsService);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);

  readonly currencies = [
    { label: 'Real Brasileiro (BRL)', value: 'BRL' },
    { label: 'Dólar Americano (USD)', value: 'USD' },
  ];

  readonly timezones = [
    { label: 'America/Sao_Paulo', value: 'America/Sao_Paulo' },
    { label: 'America/Manaus', value: 'America/Manaus' },
    { label: 'America/Belem', value: 'America/Belem' },
    { label: 'America/Fortaleza', value: 'America/Fortaleza' },
    { label: 'America/Recife', value: 'America/Recife' },
    { label: 'America/Noronha', value: 'America/Noronha' },
    { label: 'America/Porto_Velho', value: 'America/Porto_Velho' },
    { label: 'America/Boa_Vista', value: 'America/Boa_Vista' },
    { label: 'America/Rio_Branco', value: 'America/Rio_Branco' },
  ];

  readonly form = this.fb.group({
    osCodePrefix: ['', Validators.required],
    quoteCodePrefix: ['', Validators.required],
    saleCodePrefix: ['', Validators.required],
    quoteValidityDays: [30, [Validators.required, Validators.min(1)]],
    warrantyDays: [90, [Validators.required, Validators.min(0)]],
    currency: ['BRL', Validators.required],
    timezone: ['America/Sao_Paulo', Validators.required],
  });

  ngOnInit() {
    this.svc.getSettings().subscribe(s => this.form.patchValue(s as any));
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.svc.updateSettings(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Configurações salvas' });
        this.saving.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar' });
        this.saving.set(false);
      },
    });
  }
}
