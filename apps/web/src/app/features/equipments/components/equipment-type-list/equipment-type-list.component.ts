import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';

@Component({
  standalone: true,
  selector: 'app-equipment-type-list',
  imports: [
    CommonModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, ReactiveFormsModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './equipment-type-list.component.html',
})
export class EquipmentTypeListComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private confirm = inject(ConfirmationService);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Equipamentos', routerLink: '/app/equipamentos' },
    { label: 'Tipos de Equipamento' },
  ];

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
