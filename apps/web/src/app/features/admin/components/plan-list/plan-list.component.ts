import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminService, AdminPlan } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

export const MODULE_LABELS: Record<string, string> = {
  clients:        'Clientes',
  service_orders: 'Ordens de Serviço',
  sales:          'Vendas',
  inventory:      'Estoque',
  financial:      'Financeiro',
  contracts:      'Contratos',
  reports:        'Relatórios',
  settings:       'Configurações',
};

@Component({
  standalone: true,
  selector: 'app-plan-list',
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './plan-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanListComponent implements OnInit {
  private readonly svc          = inject(AdminService);
  private readonly router       = inject(Router);
  private readonly breadcrumbSvc = inject(BreadcrumbService);
  private readonly confirm      = inject(ConfirmationService);
  private readonly msg          = inject(MessageService);

  readonly plans              = signal<AdminPlan[]>([]);
  readonly loading            = signal(false);
  readonly tablePage          = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  readonly moduleLabels       = MODULE_LABELS;

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Planos' }]);
  }

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.svc.getPlans().subscribe({
      next:  data => { this.plans.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update(current => updateTablePageState(current, event));
  }

  moduleLabel(mod: string) {
    return MODULE_LABELS[mod] ?? mod;
  }

  limitLabel(val: number | null) {
    return val === null || val === 0 ? 'Ilimitado' : String(val);
  }

  confirmDelete(plan: AdminPlan) {
    this.confirm.confirm({
      message: `Deseja excluir o plano "${plan.name}"?`,
      header: 'Excluir Plano',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.deletePlan(plan.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Plano excluído' });
            this.plans.update(list => list.filter(p => p.id !== plan.id));
          },
          error: err => this.msg.add({ severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message }),
        });
      },
    });
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.plans().length, this.tablePage()),
      this.plans().length
    );
  }
}
