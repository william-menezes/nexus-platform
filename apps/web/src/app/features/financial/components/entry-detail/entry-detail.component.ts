import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FinancialEntry, Installment } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  standalone: true,
  selector: 'app-entry-detail',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, TagModule,
    DialogModule, InputNumberModule, SelectModule, ReactiveFormsModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page" *ngIf="entry() as e">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/financeiro" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">{{ e.description }}</h1>
        <p-tag [severity]="e.type === 'receivable' ? 'success' : 'danger'"
          [value]="e.type === 'receivable' ? 'A Receber' : 'A Pagar'" />
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total</p>
          <p class="text-xl font-bold">{{ e.totalAmount | currency:'BRL' }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Pago</p>
          <p class="text-lg">{{ e.paidAmount | currency:'BRL' }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Vencimento</p>
          <p class="text-lg">{{ e.dueDate | date:'dd/MM/yyyy' }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Status</p>
          <p-tag [severity]="statusSeverity(e.status)" [value]="statusLabel(e.status)" />
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-3">Parcelas</h2>
        <p-table [value]="e.installments || []">
          <ng-template pTemplate="header">
            <tr>
              <th>#</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Pago</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-inst>
            <tr>
              <td>{{ inst.installmentNumber }}</td>
              <td>{{ inst.dueDate | date:'dd/MM/yyyy' }}</td>
              <td>{{ inst.amount | currency:'BRL' }}</td>
              <td>{{ inst.paidAmount | currency:'BRL' }}</td>
              <td><p-tag [severity]="statusSeverity(inst.status)" [value]="statusLabel(inst.status)" /></td>
              <td>
                @if (inst.status !== 'paid') {
                  <button pButton icon="pi pi-check" label="Pagar" class="p-button-sm p-button-success" (click)="openPayDialog(inst)"></button>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6" class="text-center py-4 text-gray-400">Sem parcelas</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="payDialogVisible" header="Registrar Pagamento" [modal]="true" [style]="{ width: '380px' }">
      <form [formGroup]="payForm" (ngSubmit)="pay()" class="flex flex-col gap-3 pt-2">
        <div class="flex flex-col gap-1">
          <label>Valor Pago</label>
          <p-inputNumber formControlName="paidAmount" mode="currency" currency="BRL" locale="pt-BR" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Forma de Pagamento</label>
          <p-select formControlName="paymentMethod" [options]="paymentMethods" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <button pButton type="button" label="Cancelar" class="p-button-secondary" (click)="payDialogVisible = false"></button>
          <button pButton type="submit" label="Confirmar" [loading]="paying()" [disabled]="payForm.invalid"></button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class EntryDetailComponent implements OnInit {
  private svc = inject(FinancialService);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  entry = signal<FinancialEntry | null>(null);
  payDialogVisible = false;
  paying = signal(false);
  selectedInstallmentId = '';

  paymentMethods = [
    { label: 'Dinheiro', value: 'cash' },
    { label: 'Crédito', value: 'credit' },
    { label: 'Débito', value: 'debit' },
    { label: 'PIX', value: 'pix' },
    { label: 'Boleto', value: 'boleto' },
    { label: 'Transferência', value: 'transfer' },
  ];

  payForm = this.fb.group({
    paidAmount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['pix'],
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.svc.getEntry(id).subscribe(e => this.entry.set(e));
  }

  openPayDialog(inst: Installment) {
    this.selectedInstallmentId = inst.id;
    this.payForm.patchValue({ paidAmount: inst.amount });
    this.payDialogVisible = true;
  }

  pay() {
    if (this.payForm.invalid) return;
    this.paying.set(true);
    const dto = this.payForm.getRawValue() as { paidAmount: number; paymentMethod: string };
    this.svc.payInstallment(this.selectedInstallmentId, dto).subscribe({
      next: () => {
        this.payDialogVisible = false;
        this.paying.set(false);
        this.msg.add({ severity: 'success', summary: 'Pagamento registrado' });
        const id = this.route.snapshot.params['id'];
        this.svc.getEntry(id).subscribe(e => this.entry.set(e));
      },
      error: () => { this.paying.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao registrar' }); },
    });
  }

  statusLabel(status: string) {
    const map: Record<string, string> = {
      pending: 'Pendente', partial: 'Parcial', paid: 'Pago', overdue: 'Vencido', cancelled: 'Cancelado',
    };
    return map[status] ?? status;
  }

  statusSeverity(status: string): TagSeverity {
    const map: Record<string, TagSeverity> = {
      pending: 'warn', partial: 'info', paid: 'success', overdue: 'danger', cancelled: 'secondary',
    };
    return map[status] ?? 'secondary';
  }
}
