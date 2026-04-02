import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CashSession, CashRegister, CashMovement } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-cash-session',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputNumberModule,
    InputTextModule, SelectModule, ButtonModule, TagModule, TableModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-3xl">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/financeiro" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">Controle de Caixa</h1>
      </div>

      @if (!session()) {
        <!-- No open session -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Abrir Caixa</h2>
          <form [formGroup]="openForm" (ngSubmit)="openSession()" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label>Caixa *</label>
              <p-select formControlName="cashRegisterId" [options]="registers()" optionLabel="name" optionValue="id"
                placeholder="Selecione o caixa..." />
            </div>
            <div class="flex flex-col gap-1">
              <label>Valor de Abertura (troco) *</label>
              <p-inputNumber formControlName="openingAmount" mode="currency" currency="BRL" locale="pt-BR" />
            </div>
            <button pButton type="submit" label="Abrir Caixa" icon="pi pi-unlock"
              [loading]="acting()" [disabled]="openForm.invalid"></button>
          </form>
        </div>
      } @else {
        <!-- Open session -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold text-green-800">Caixa Aberto</p>
              <p class="text-sm text-green-600">Aberto em {{ session()!.openedAt | date:'dd/MM/yyyy HH:mm' }}</p>
              <p class="text-sm text-green-600">Valor inicial: {{ session()!.openingAmount | currency:'BRL' }}</p>
            </div>
            <p-tag severity="success" value="ABERTO" />
          </div>
        </div>

        <!-- Add movement -->
        <div class="bg-white rounded-lg shadow p-4 mb-4">
          <h2 class="text-lg font-semibold mb-3">Registrar Movimentação</h2>
          <form [formGroup]="movForm" (ngSubmit)="addMovement()" class="grid grid-cols-3 gap-3 items-end">
            <div class="flex flex-col gap-1">
              <label>Tipo</label>
              <p-select formControlName="type" [options]="movTypes" optionLabel="label" optionValue="value" />
            </div>
            <div class="flex flex-col gap-1">
              <label>Valor</label>
              <p-inputNumber formControlName="amount" mode="currency" currency="BRL" locale="pt-BR" />
            </div>
            <div class="flex flex-col gap-1">
              <label>Descrição</label>
              <input pInputText formControlName="description" />
            </div>
            <div class="col-span-3 flex justify-end">
              <button pButton type="submit" label="Registrar" [loading]="acting()" [disabled]="movForm.invalid"></button>
            </div>
          </form>
        </div>

        <!-- Movements table -->
        <div class="bg-white rounded-lg shadow p-4 mb-4">
          <h2 class="text-lg font-semibold mb-3">Movimentações</h2>
          <p-table [value]="movements()">
            <ng-template pTemplate="header">
              <tr>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Hora</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-m>
              <tr>
                <td>{{ movLabel(m.type) }}</td>
                <td>{{ m.description }}</td>
                <td [class]="isCredit(m.type) ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                  {{ isCredit(m.type) ? '+' : '-' }}{{ m.amount | currency:'BRL' }}
                </td>
                <td>{{ m.createdAt | date:'HH:mm' }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="4" class="text-center py-4 text-gray-400">Sem movimentações</td></tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Close session -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-3">Fechar Caixa</h2>
          <form [formGroup]="closeForm" (ngSubmit)="closeSession()" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label>Valor em Caixa (contagem)</label>
              <p-inputNumber formControlName="closingAmount" mode="currency" currency="BRL" locale="pt-BR" />
            </div>
            <div class="flex flex-col gap-1">
              <label>Observações</label>
              <input pInputText formControlName="notes" />
            </div>
            <button pButton type="submit" label="Fechar Caixa" icon="pi pi-lock" class="p-button-danger"
              [loading]="acting()" [disabled]="closeForm.invalid"></button>
          </form>
        </div>
      }
    </div>
  `,
})
export class CashSessionComponent implements OnInit {
  private svc = inject(FinancialService);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  session = signal<CashSession | null>(null);
  registers = signal<CashRegister[]>([]);
  movements = signal<CashMovement[]>([]);
  acting = signal(false);

  movTypes = [
    { label: 'Recebimento', value: 'receipt' },
    { label: 'Sangria', value: 'withdrawal' },
    { label: 'Despesa', value: 'expense' },
    { label: 'Ajuste', value: 'adjustment' },
  ];

  openForm = this.fb.group({
    cashRegisterId: ['', Validators.required],
    openingAmount: [0, Validators.required],
  });

  closeForm = this.fb.group({
    closingAmount: [0, Validators.required],
    notes: [null as string | null],
  });

  movForm = this.fb.group({
    type: ['receipt', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', Validators.required],
  });

  ngOnInit() {
    this.svc.getRegisters().subscribe(r => this.registers.set(r));
    this.loadSession();
  }

  loadSession() {
    this.svc.getCurrentSession().subscribe(s => {
      this.session.set(s);
      if (s) {
        this.svc.getSession(s.id).subscribe(full => this.movements.set(full.movements ?? []));
      }
    });
  }

  openSession() {
    if (this.openForm.invalid) return;
    this.acting.set(true);
    const dto = this.openForm.getRawValue() as { cashRegisterId: string; openingAmount: number };
    this.svc.openSession(dto).subscribe({
      next: () => { this.acting.set(false); this.loadSession(); this.msg.add({ severity: 'success', summary: 'Caixa aberto' }); },
      error: (e) => { this.acting.set(false); this.msg.add({ severity: 'error', summary: e.error?.message ?? 'Erro ao abrir caixa' }); },
    });
  }

  closeSession() {
    if (this.closeForm.invalid) return;
    this.acting.set(true);
    const raw = this.closeForm.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as { closingAmount: number; notes?: string };
    this.svc.closeSession(dto).subscribe({
      next: () => { this.acting.set(false); this.session.set(null); this.movements.set([]); this.msg.add({ severity: 'success', summary: 'Caixa fechado' }); },
      error: () => { this.acting.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao fechar caixa' }); },
    });
  }

  addMovement() {
    if (this.movForm.invalid) return;
    this.acting.set(true);
    const dto = this.movForm.getRawValue() as { type: string; amount: number; description: string };
    this.svc.createMovement(dto).subscribe({
      next: () => { this.acting.set(false); this.movForm.reset({ type: 'receipt', amount: 0, description: '' }); this.loadSession(); },
      error: () => { this.acting.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao registrar' }); },
    });
  }

  isCredit(type: string) {
    return ['sale', 'receipt'].includes(type);
  }

  movLabel(type: string) {
    const map: Record<string, string> = {
      sale: 'Venda', receipt: 'Recebimento', withdrawal: 'Sangria', expense: 'Despesa', adjustment: 'Ajuste',
    };
    return map[type] ?? type;
  }
}
