import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { Employee } from '@nexus-platform/shared-types';
import { EmployeesService } from '../../employees.service';

@Component({
  standalone: true,
  selector: 'app-employee-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    InputNumberModule, ToggleButtonModule, ButtonModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './employee-form.component.html',
})
export class EmployeeFormComponent implements OnInit {
  private svc = inject(EmployeesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly isEditSignal = signal(!!this.route.snapshot.paramMap.get('id'));
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Funcionários', routerLink: '/app/funcionarios' },
      { label: this.isEditSignal() ? 'Editar Funcionário' : 'Novo Funcionário' },
    ];
  }

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
