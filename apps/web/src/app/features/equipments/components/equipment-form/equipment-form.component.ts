import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';

@Component({
  standalone: true,
  selector: 'app-equipment-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    TextareaModule, SelectModule, ButtonModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './equipment-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentFormComponent implements OnInit {
  private svc = inject(EquipmentsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  isEdit = false;
  editId = '';
  saving = signal(false);
  types = signal<EquipmentType[]>([]);

  constructor() {
    const isEdit = !!this.route.snapshot.paramMap.get('id');
    this.breadcrumbSvc.set([
      { label: 'Equipamentos', routerLink: '/app/equipamentos' },
      { label: isEdit ? 'Editar Equipamento' : 'Novo Equipamento' },
    ]);
  }

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
