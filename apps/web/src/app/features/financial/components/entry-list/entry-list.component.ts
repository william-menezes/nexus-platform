import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { FinancialEntry } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  standalone: true,
  selector: 'app-entry-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    TagModule, SelectModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './entry-list.component.html',
})
export class EntryListComponent implements OnInit {
  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' }];

  private svc = inject(FinancialService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  entries = signal<FinancialEntry[]>([]);
  loading = signal(false);
  filterType = '';
  filterStatus = '';

  typeOptions = [
    { label: 'Todos', value: '' },
    { label: 'A Receber', value: 'receivable' },
    { label: 'A Pagar', value: 'payable' },
  ];

  statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendente', value: 'pending' },
    { label: 'Parcial', value: 'partial' },
    { label: 'Pago', value: 'paid' },
    { label: 'Vencido', value: 'overdue' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getEntries(this.filterType || undefined, this.filterStatus || undefined).subscribe({
      next: data => { this.entries.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
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

  confirmDelete(e: FinancialEntry) {
    this.confirm.confirm({
      message: `Remover lançamento "${e.description}"?`,
      accept: () => this.svc.deleteEntry(e.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
