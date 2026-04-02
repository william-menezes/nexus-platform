import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';

@Component({
  standalone: true,
  selector: 'app-equipment-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    TextareaModule, SelectModule, ButtonModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="p-4 max-w-lg">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/equipamentos" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">{{ isEdit ? 'Editar Equipamento' : 'Novo Equipamento' }}</h1>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Tipo de Equipamento *</label>
          <p-select formControlName="equipmentTypeId" [options]="types()" optionLabel="name" optionValue="id" placeholder="Selecione..." />
        </div>
        <div class="flex flex-col gap-1">
          <label>Marca</label>
          <input pInputText formControlName="brand" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Modelo</label>
          <input pInputText formControlName="model" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Observações</label>
          <textarea pTextarea formControlName="notes" rows="3"></textarea>
        </div>
        <div class="flex gap-2 mt-2">
          <button pButton type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid"></button>
          <a routerLink="/app/equipamentos" pButton class="p-button-secondary" label="Cancelar"></a>
        </div>
      </form>
    </div>
  `,
})
export class EquipmentFormComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  isEdit = false;
  editId = '';
  saving = signal(false);
  types = signal<EquipmentType[]>([]);

  form = this.fb.group({
    equipmentTypeId: ['', Validators.required],
    brand: [null as string | null],
    model: [null as string | null],
    notes: [null as string | null],
  });

  ngOnInit() {
    this.svc.getAllTypes().subscribe(t => this.types.set(t));
    this.editId = this.route.snapshot.params['id'];
    if (this.editId) {
      this.isEdit = true;
      this.svc.getOne(this.editId).subscribe(e => this.form.patchValue(e as any));
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<Equipment>;
    const req = this.isEdit ? this.svc.update(this.editId, dto) : this.svc.create(dto);
    req.subscribe({
      next: () => this.router.navigate(['/app/equipamentos']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
