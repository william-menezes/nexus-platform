import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';

@Component({
  standalone: true,
  selector: 'app-equipment-type-list',
  imports: [
    CommonModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, ReactiveFormsModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="nx-page">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Tipos de Equipamento</h1>
        <button pButton label="Novo Tipo" icon="pi pi-plus" class="p-button-sm" (click)="openDialog()"></button>
      </div>
      <p-table [value]="types()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>Campos</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-t>
          <tr>
            <td>{{ t.name }}</td>
            <td>{{ (t.fieldsSchema || []).length }} campo(s)</td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text mr-1" (click)="openDialog(t)"></button>
              <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDelete(t)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="3" class="text-center py-8 text-gray-400">Nenhum tipo encontrado</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="editId ? 'Editar Tipo' : 'Novo Tipo'" [modal]="true" [style]="{ width: '400px' }">
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3 pt-2">
        <div class="flex flex-col gap-1">
          <label>Nome *</label>
          <input pInputText formControlName="name" />
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <button pButton type="button" label="Cancelar" class="p-button-secondary" (click)="dialogVisible = false"></button>
          <button pButton type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid"></button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class EquipmentTypeListComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  types = signal<EquipmentType[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editId = '';

  form = this.fb.group({ name: ['', Validators.required] });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAllTypes().subscribe({
      next: data => { this.types.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(t?: EquipmentType) {
    this.editId = t?.id ?? '';
    this.form.reset({ name: t?.name ?? '' });
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const dto = { name: this.form.value.name! };
    const req = this.editId ? this.svc.updateType(this.editId, dto) : this.svc.createType(dto);
    req.subscribe({
      next: () => { this.dialogVisible = false; this.saving.set(false); this.load(); },
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }

  confirmDelete(t: EquipmentType) {
    this.confirm.confirm({
      message: `Remover tipo "${t.name}"?`,
      accept: () => this.svc.removeType(t.id).subscribe({
        next: () => { this.msg.add({ severity: 'success', summary: 'Removido' }); this.load(); },
        error: () => this.msg.add({ severity: 'error', summary: 'Erro ao remover' }),
      }),
    });
  }
}
