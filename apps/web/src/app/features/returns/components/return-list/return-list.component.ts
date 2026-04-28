import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { Return } from '@nexus-platform/shared-types';
import { ReturnsService } from '../../returns.service';


const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovada',
  completed: 'Concluída', rejected: 'Rejeitada',
};
const STATUS_SEVERITY: Record<string, string> = {
  pending: 'warn', approved: 'info',
  completed: 'success', rejected: 'danger',
};
const TYPE_LABELS: Record<string, string> = {
  refund: 'Estorno', credit: 'Crédito', exchange: 'Troca',
};

@Component({
  standalone: true,
  selector: 'app-return-list',
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, SelectModule, TagModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './return-list.component.html',
})
export class ReturnListComponent implements OnInit {
  private readonly svc = inject(ReturnsService);
  private readonly msg = inject(MessageService);

  readonly returns = signal<Return[]>([]);
  readonly loading = signal(false);
  statusFilter: string | null = null;

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Devoluções', routerLink: '/app/vendas/devolucoes' }];

  readonly statusOptions = [
    { label: 'Pendente',   value: 'pending' },
    { label: 'Aprovada',   value: 'approved' },
    { label: 'Concluída',  value: 'completed' },
    { label: 'Rejeitada',  value: 'rejected' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.findAll(this.statusFilter ?? undefined).subscribe({
      next: data => { this.returns.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  statusSeverity(s: string): any { return STATUS_SEVERITY[s] ?? 'secondary'; }
  typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }
}
