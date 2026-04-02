import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';

@Component({
  standalone: true,
  selector: 'app-equipment-list',
  imports: [
    CommonModule, RouterLink, TableModule, ButtonModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Equipamentos</h1>
        <div class="flex gap-2">
          <a routerLink="tipos" pButton label="Tipos" icon="pi pi-cog" class="p-button-sm p-button-secondary"></a>
          <a routerLink="novo" pButton label="Novo Equipamento" icon="pi pi-plus" class="p-button-sm"></a>
        </div>
      </div>
      <p-table [value]="equipments()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Tipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Observações</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr>
            <td>{{ getTypeName(e.equipmentTypeId) }}</td>
            <td>{{ e.brand || '—' }}</td>
            <td>{{ e.model || '—' }}</td>
            <td>{{ e.notes || '—' }}</td>
            <td>
              <a [routerLink]="[e.id, 'editar']" pButton icon="pi pi-pencil" class="p-button-sm p-button-text mr-1"></a>
              <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(e)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" class="text-center py-8 text-gray-400">Nenhum equipamento encontrado</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class EquipmentListComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);

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
