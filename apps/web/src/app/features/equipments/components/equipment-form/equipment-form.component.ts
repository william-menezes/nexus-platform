import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';

@Component({
  standalone: true,
  selector: 'app-equipment-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    TextareaModule, SelectModule, ButtonModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './equipment-form.component.html',
})
export class EquipmentFormComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly isEditSignal = signal(!!this.route.snapshot.paramMap.get('id'));
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Equipamentos', routerLink: '/app/equipamentos' },
      { label: this.isEditSignal() ? 'Editar Equipamento' : 'Novo Equipamento' },
    ];
  }

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
