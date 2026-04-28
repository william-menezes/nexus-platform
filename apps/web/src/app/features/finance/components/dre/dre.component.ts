import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { DreEntry } from '@nexus-platform/shared-types';
import { FinanceService } from '../../finance.service';

@Component({
  standalone: true,
  selector: 'app-dre',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, PercentPipe, ButtonModule, CardModule, TableModule, MessageModule, DividerModule, DatePickerModule, BreadcrumbModule],
  templateUrl: './dre.component.html',
})
export class DreComponent {
  private readonly fb  = inject(FormBuilder);
  private readonly svc = inject(FinanceService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Financeiro', routerLink: '/app/financeiro' },
    { label: 'DRE' },
  ];

  entries: DreEntry[] = [];
  loading = false;
  error   = '';

  form = this.fb.group({
    from: [null as Date | null, Validators.required],
    to:   [null as Date | null, Validators.required],
  });

  get totalRevenue() { return this.entries.reduce((a, e) => a + e.revenue, 0); }
  get totalCost()    { return this.entries.reduce((a, e) => a + e.costOfGoods, 0); }
  get totalProfit()  { return this.entries.reduce((a, e) => a + e.grossProfit, 0); }
  get avgMargin()    {
    return this.totalRevenue > 0 ? this.totalProfit / this.totalRevenue : 0;
  }

  search() {
    if (this.form.invalid) return;
    const from = this.form.value.from;
    const to   = this.form.value.to;
    if (!from || !to) return;

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    this.loading = true;
    this.error   = '';
    this.svc.getDre(fmt(from), fmt(to)).subscribe({
      next: (data) => { this.entries = data; this.loading = false; },
      error: ()    => { this.error = 'Erro ao carregar DRE.'; this.loading = false; },
    });
  }

  maxRevenue() {
    return Math.max(...this.entries.map(e => e.revenue), 1);
  }

  barWidth(value: number) {
    return `${Math.round((value / this.maxRevenue()) * 100)}%`;
  }
}
