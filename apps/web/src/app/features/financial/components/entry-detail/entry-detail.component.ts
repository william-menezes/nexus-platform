import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { FinancialEntry, Installment } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  standalone: true,
  selector: 'app-entry-detail',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, TagModule,
    DialogModule, InputNumberModule, SelectModule, ReactiveFormsModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './entry-detail.component.html',
})
export class EntryDetailComponent implements OnInit {
  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' },
      { label: this.entry()?.description ?? '...' },
    ];
  }

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
