import { Component, inject, signal, OnInit } from '@angular/core';
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

@Component({
  standalone: true,
  selector: 'app-equipment-list',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './equipment-list.component.html',
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

  ngOnInit() {
    this.svc.getAllTypes().subscribe(t => this.types.set(t));
    this.load();
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
