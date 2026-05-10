import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { SalesByEmployeeEntry } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';

@Component({
  standalone: true,
  selector: 'app-sales-by-employee',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, ButtonModule, CardModule, TableModule, MessageModule, DatePickerModule],
  templateUrl: './sales-by-employee.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesByEmployeeComponent {
  private readonly fb  = inject(FormBuilder);
  private readonly svc = inject(FinanceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() {
    this.breadcrumbSvc.set([
      { label: 'Financeiro', routerLink: '/app/financeiro' },
      { label: 'Relatórios' },
      { label: 'Por Funcionário' },
    ]);
  }

  entries: SalesByEmployeeEntry[] = [];
  loading = false;
  error   = '';

  form = this.fb.group({
    from: [null as Date | null, Validators.required],
    to:   [null as Date | null, Validators.required],
  });

  get totalSales()   { return this.entries.reduce((a, e) => a + e.salesCount, 0); }
  get totalRevenue() { return this.entries.reduce((a, e) => a + e.totalRevenue, 0); }

  search() {
    if (this.form.invalid) return;
    const from = this.form.value.from;
    const to   = this.form.value.to;
    if (!from || !to) return;
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    this.loading = true;
    this.error   = '';
    this.svc.getReportByEmployee(fmt(from), fmt(to)).subscribe({
      next: (data) => { this.entries = data; this.loading = false; this.cdr.markForCheck(); },
      error: ()    => { this.error = 'Erro ao carregar relatório.'; this.loading = false; this.cdr.markForCheck(); },
    });
  }
}
