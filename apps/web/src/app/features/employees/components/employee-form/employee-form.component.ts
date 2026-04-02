import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Employee } from '@nexus-platform/shared-types';
import { EmployeesService } from '../../employees.service';

@Component({
  standalone: true,
  selector: 'app-employee-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    InputNumberModule, ToggleButtonModule, ButtonModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-lg">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/funcionarios" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">{{ isEdit ? 'Editar Funcionário' : 'Novo Funcionário' }}</h1>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Nome *</label>
          <input pInputText formControlName="name" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Cargo</label>
          <input pInputText formControlName="roleLabel" placeholder="Técnico, Vendedor..." />
        </div>
        <div class="flex flex-col gap-1">
          <label>Telefone</label>
          <input pInputText formControlName="phone" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Email</label>
          <input pInputText formControlName="email" type="email" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Comissão (%)</label>
          <p-inputNumber formControlName="commissionRate" [min]="0" [max]="100" [minFractionDigits]="2" />
        </div>
        <div class="flex items-center gap-2">
          <p-toggleButton formControlName="isActive" onLabel="Ativo" offLabel="Inativo" />
        </div>
        <div class="flex gap-2 mt-2">
          <button pButton type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid"></button>
          <a routerLink="/app/funcionarios" pButton class="p-button-secondary" label="Cancelar"></a>
        </div>
      </form>
    </div>
  `,
})
export class EmployeeFormComponent implements OnInit {
  private svc = inject(EmployeesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  isEdit = false;
  editId = '';
  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    roleLabel: [null as string | null],
    phone: [null as string | null],
    email: [null as string | null],
    commissionRate: [0],
    isActive: [true],
  });

  ngOnInit() {
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
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<Employee>;
    const req = this.isEdit
      ? this.svc.update(this.editId, dto)
      : this.svc.create(dto);
    req.subscribe({
      next: () => this.router.navigate(['/app/funcionarios']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
