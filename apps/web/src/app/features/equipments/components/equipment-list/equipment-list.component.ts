import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';
import {
  createInitialTablePageState,
  formatTableSummary,
  getVisibleTableRecords,
  TABLE_ROWS_PER_PAGE_OPTIONS,
  updateTablePageState,
} from '../../../../shared/utils/table-pagination.util';

@Component({
  standalone: true,
  selector: 'app-equipment-list',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './equipment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentListComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [{ label: 'Equipamentos', routerLink: '/app/equipamentos' }];

  equipments = signal<Equipment[]>([]);
  types = signal<EquipmentType[]>([]);
  loading = signal(false);
  readonly tablePage = signal(createInitialTablePageState());
  readonly rowsPerPageOptions = TABLE_ROWS_PER_PAGE_OPTIONS;

  ngOnInit() {
    this.svc.getAllTypes().subscribe(t => this.types.set(t));
    this.load();
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.tablePage.update((current) => updateTablePageState(current, event));
  }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: data => { this.equipments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getTypeName(typeId: string) {
    return this.types().find(t => t.id === typeId)?.name ?? typeId;
  }

  tableSummary() {
    return formatTableSummary(
      getVisibleTableRecords(this.equipments().length, this.tablePage()),
      this.equipments().length
    );
  }

  confirmDelete(e: Equipment) {
    this.confirm.confirm({
      message: `Remover equipamento?`,
      accept: () => this.svc.remove(e.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
