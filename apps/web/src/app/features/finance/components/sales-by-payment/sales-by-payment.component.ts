import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { SalesByPaymentEntry } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';

@Component({
  standalone: true,
  selector: 'app-sales-by-payment',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, PercentPipe, ButtonModule, CardModule, TableModule, MessageModule, DatePickerModule],
  templateUrl: './sales-by-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesByPaymentComponent {
  private readonly fb  = inject(FormBuilder);
  private readonly svc = inject(FinanceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() {
    this.breadcrumbSvc.set([
      { label: 'Financeiro', routerLink: '/app/financeiro' },
      { label: 'Relatórios' },
      { label: 'Por Pagamento' },
    ]);
  }

  entries: SalesByPaymentEntry[] = [];
  loading = false;
  error   = '';

  form = this.fb.group({
    from: [null as Date | null, Validators.required],
    to:   [null as Date | null, Validators.required],
  });

  get totalAmount() { return this.entries.reduce((a, e) => a + e.totalAmount, 0); }
  get totalCount()  { return this.entries.reduce((a, e) => a + e.count, 0); }

  readonly methodColors: Record<string, string> = {
    cash: '#22c55e', credit: '#3b82f6', debit: '#8b5cf6',
    pix:  '#f59e0b', boleto: '#ef4444', transfer: '#6b7280',
  };

  methodColor(method: string) {
    return this.methodColors[method] ?? '#6b7280';
  }

  search() {
    if (this.form.invalid) return;
    const from = this.form.value.from;
    const to   = this.form.value.to;
    if (!from || !to) return;
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    this.loading = true;
    this.error   = '';
    this.svc.getReportByPayment(fmt(from), fmt(to)).subscribe({
      next: (data) => { this.entries = data; this.loading = false; this.cdr.markForCheck(); },
      error: ()    => { this.error = 'Erro ao carregar relatório.'; this.loading = false; this.cdr.markForCheck(); },
    });
  }
}
