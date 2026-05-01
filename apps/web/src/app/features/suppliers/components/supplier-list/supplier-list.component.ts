import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Supplier } from '@nexus-platform/shared-types';
import { SuppliersService } from '../../suppliers.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-supplier-list',
  imports: [
    CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
    CardModule, InputTextModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './supplier-list.component.html',
})
export class SupplierListComponent implements OnInit {
  private readonly svc        = inject(SuppliersService);
  private readonly confirm    = inject(ConfirmationService);
  private readonly msg        = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() { this.breadcrumbSvc.set([{ label: 'Fornecedores' }]); }

  readonly suppliers        = signal<Supplier[]>([]);
  readonly loading          = signal(false);
  readonly tablePage        = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;
  search = '';
  private readonly search$  = new Subject<string | undefined>();

  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading.set(true);
        return this.svc.findAll(q);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next:  data => { this.suppliers.set(data); this.loading.set(false); },
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

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.suppliers().length, this.tablePage()),
      this.suppliers().length
    );
  }

  confirmDelete(s: Supplier) {
    this.confirm.confirm({
      message: `Excluir fornecedor "${s.name}"?`,
      header: 'Confirmar exclus?o',
      icon: 'pi pi-trash',
      accept: () => {
        this.svc.remove(s.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Exclu?do', detail: s.name });
            this.search$.next(this.search || undefined);
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
