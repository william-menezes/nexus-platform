import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Contract } from '@nexus-platform/shared-types';
import { ContractsService } from '../../contracts.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', active: 'Ativo', suspended: 'Suspenso',
  cancelled: 'Cancelado', expired: 'Expirado',
};
const STATUS_SEVERITY: Record<string, string> = {
  draft: 'secondary', active: 'success', suspended: 'warn',
  cancelled: 'danger', expired: 'secondary',
};
const TYPE_LABELS: Record<string, string> = {
  fixed: 'Mensal Fixo',
  hourly_franchise: 'Franquia de Horas',
};

@Component({
  standalone: true,
  selector: 'app-contract-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, SelectModule, TagModule,
    ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './contract-list.component.html',
})
export class ContractListComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);

  readonly contracts = signal<Contract[]>([]);
  readonly loading = signal(false);
  statusFilter: string | null = null;

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Contratos', routerLink: '/app/contratos' }];

  readonly statusOptions = [
    { label: 'Rascunho',  value: 'draft' },
    { label: 'Ativo',     value: 'active' },
    { label: 'Suspenso',  value: 'suspended' },
    { label: 'Cancelado', value: 'cancelled' },
    { label: 'Expirado',  value: 'expired' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.statusFilter ?? undefined).subscribe({
      next: data => { this.contracts.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }

  confirmDelete(c: Contract) {
    this.confirm.confirm({
      message: `Excluir contrato "${c.code}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(c.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído', detail: c.code });
            this.load();
          },
          error: (err) => this.msg.add({
            severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message,
          }),
        });
      },
    });
  }
}
