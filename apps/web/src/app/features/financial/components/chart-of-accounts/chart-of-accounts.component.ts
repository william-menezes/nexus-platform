import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ChartOfAccount } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-chart-of-accounts',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, TagModule,
    ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <a routerLink="/app/financeiro" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
          <h1 class="text-2xl font-bold">Plano de Contas</h1>
        </div>
      </div>
      <p-table [value]="accounts()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Sistema</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-a>
          <tr>
            <td class="font-mono">{{ a.code }}</td>
            <td>{{ a.name }}</td>
            <td>{{ typeLabel(a.type) }}</td>
            <td>
              @if (a.isSystem) {
                <p-tag severity="secondary" value="Sistema" />
              }
            </td>
            <td>
              @if (!a.isSystem) {
                <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(a)"></button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" class="text-center py-8 text-gray-400">Nenhuma conta encontrada</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class ChartOfAccountsComponent implements OnInit {
  private svc = inject(FinancialService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

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
