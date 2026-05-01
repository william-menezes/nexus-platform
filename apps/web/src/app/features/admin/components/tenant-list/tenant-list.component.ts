import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminService, AdminTenant } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

const PLAN_SEVERITY: Record<string, string> = {
  trial: 'warn', starter: 'info', pro: 'success', enterprise: 'contrast',
};

@Component({
  standalone: true,
  selector: 'app-tenant-list',
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tenant-list.component.html',
})
export class TenantListComponent implements OnInit {
  private readonly svc        = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);
  private readonly confirm    = inject(ConfirmationService);
  private readonly msg        = inject(MessageService);

  readonly tenants          = signal<AdminTenant[]>([]);
  readonly loading          = signal(false);
  readonly tablePage        = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search = '';
  private readonly search$  = new Subject<string | undefined>();

  constructor() {
    this.breadcrumbSvc.set([{ label: 'Tenants' }]);
  }

  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading.set(true);
        return this.svc.findAllTenants(q);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next:  data => { this.tenants.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); },
    });
    this.search$.next(undefined);
  }

  onSearchInput() {
    this.search$.next(this.search || undefined);
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  planSeverity(plan: string): any { return PLAN_SEVERITY[plan] ?? 'secondary'; }

  confirmDelete(tenant: AdminTenant) {
    this.confirm.confirm({
      message: `Deseja excluir o tenant "${tenant.name}"?`,
      accept: () => {
        this.svc.deleteTenant(tenant.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Tenant excluído' });
            this.tenants.update(list => list.filter(t => t.id !== tenant.id));
          },
          error: err => this.msg.add({ severity: 'error', summary: 'Erro ao excluir', detail: err?.error?.message }),
        });
      },
    });
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.tenants().length, this.tablePage()),
      this.tenants().length
    );
  }
}
