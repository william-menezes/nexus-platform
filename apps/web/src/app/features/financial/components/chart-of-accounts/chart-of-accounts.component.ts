import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ChartOfAccount } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-chart-of-accounts',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, TagModule,
    ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './chart-of-accounts.component.html',
})
export class ChartOfAccountsComponent implements OnInit {
  private svc = inject(FinancialService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Configurações', routerLink: '/app/configuracoes' },
    { label: 'Plano de Contas' },
  ];

  accounts = signal<ChartOfAccount[]>([]);
  loading = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAccounts().subscribe({
      next: data => { this.accounts.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(type: string) {
    const map: Record<string, string> = {
      revenue: 'Receita', cost: 'Custo', expense: 'Despesa', asset: 'Ativo', liability: 'Passivo',
    };
    return map[type] ?? type;
  }

  confirmDelete(a: ChartOfAccount) {
    this.confirm.confirm({
      message: `Remover conta "${a.name}"?`,
      accept: () => this.svc.deleteAccount(a.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removida' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
