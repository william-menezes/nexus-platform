import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContractsService } from '../../contracts.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ClientOption { id: string; name: string; }

@Component({
  standalone: true,
  selector: 'app-contract-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, DatePickerModule,
    SelectModule, TextareaModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/contratos" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">
          {{ isEdit() ? 'Editar Contrato' : 'Novo Contrato' }}
        </h1>
      </div>

      <p-card>
        <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Cliente *</label>
              <p-select formControlName="clientId" [options]="clients()"
                optionLabel="name" optionValue="id"
                placeholder="Selecione o cliente" [filter]="true"
                filterBy="name" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Tipo *</label>
              <p-select formControlName="type" [options]="typeOptions"
                optionLabel="label" optionValue="value"
                placeholder="Tipo de contrato" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1" *ngIf="form.get('type')?.value === 'fixed'">
              <label class="font-medium">Valor Mensal (R$) *</label>
              <p-inputNumber formControlName="monthlyValue" mode="currency" currency="BRL"
                locale="pt-BR" [minFractionDigits]="2" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1" *ngIf="form.get('type')?.value === 'hourly_franchise'">
              <label class="font-medium">Horas Franquia *</label>
              <p-inputNumber formControlName="franchiseHours" [minFractionDigits]="0"
                [maxFractionDigits]="2" styleClass="w-full" suffix=" h" />
            </div>

            <div class="flex flex-col gap-1" *ngIf="form.get('type')?.value === 'hourly_franchise'">
              <label class="font-medium">Preço Hora Excedente (R$) *</label>
              <p-inputNumber formControlName="hourExcessPrice" mode="currency" currency="BRL"
                locale="pt-BR" [minFractionDigits]="2" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Início *</label>
              <p-datepicker formControlName="startDate" dateFormat="dd/mm/yy"
                [showIcon]="true" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Término (vazio = indeterminado)</label>
              <p-datepicker formControlName="endDate" dateFormat="dd/mm/yy"
                [showIcon]="true" [showClear]="true" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Dia de Faturamento</label>
              <p-inputNumber formControlName="billingDay" [min]="1" [max]="28"
                styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Taxa de Reajuste Anual (%)</label>
              <p-inputNumber formControlName="adjustmentRate" [minFractionDigits]="2"
                suffix=" %" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Descrição</label>
              <textarea pTextarea formControlName="description" rows="3"
                placeholder="Descrição do contrato..."></textarea>
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Observações</label>
              <textarea pTextarea formControlName="notes" rows="2"
                placeholder="Observações internas..."></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <a routerLink="/app/contratos" pButton label="Cancelar"
              class="p-button-outlined p-button-sm"></a>
            <button pButton type="submit"
              [label]="isEdit() ? 'Salvar' : 'Criar Contrato'"
              icon="pi pi-check" class="p-button-sm"
              [disabled]="form.invalid || saving()"></button>
          </div>
        </form>
      </p-card>
    </div>
  `,
})
export class ContractFormComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly clients = signal<ClientOption[]>([]);
  readonly isEdit = signal(false);
  readonly saving = signal(false);
  private editId: string | null = null;

  readonly typeOptions = [
    { label: 'Mensal Fixo',        value: 'fixed' },
    { label: 'Franquia de Horas',  value: 'hourly_franchise' },
  ];

  readonly form = this.fb.group({
    clientId:        ['', Validators.required],
    type:            ['fixed', Validators.required],
    description:     [''],
    monthlyValue:    [null as number | null],
    franchiseHours:  [null as number | null],
    hourExcessPrice: [null as number | null],
    startDate:       [null as Date | null, Validators.required],
    endDate:         [null as Date | null],
    billingDay:      [1],
    adjustmentRate:  [0],
    notes:           [''],
  });

  ngOnInit() {
    this.http.get<ClientOption[]>(`${environment.apiUrl}/clients`).subscribe(
      c => this.clients.set(c),
    );

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      this.svc.findOne(id).subscribe(c => {
        this.form.patchValue({
          ...c,
          startDate: c.startDate ? new Date(c.startDate) : null,
          endDate: c.endDate ? new Date(c.endDate) : null,
        });
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: any = {
      ...raw,
      startDate: raw.startDate ? (raw.startDate as Date).toISOString().split('T')[0] : undefined,
      endDate: raw.endDate ? (raw.endDate as Date).toISOString().split('T')[0] : undefined,
    };

    const req = this.isEdit()
      ? this.svc.update(this.editId!, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: (c) => {
        this.msg.add({ severity: 'success', summary: this.isEdit() ? 'Salvo' : 'Criado', detail: c.code });
        this.router.navigate(['/app/contratos', c.id]);
      },
      error: (err) => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
