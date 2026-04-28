import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Employee } from '@nexus-platform/shared-types';
import { EmployeesService } from '../../employees.service';

@Component({
  standalone: true,
  selector: 'app-invite-employee',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, SelectModule, CardModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './invite-employee.component.html',
})
export class InviteEmployeeComponent implements OnInit {
  private readonly svc = inject(EmployeesService);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Funcionários', routerLink: '/app/funcionarios' },
    { label: 'Convidar Funcionário' },
  ];

  readonly employees = signal<Employee[]>([]);
  readonly sending = signal(false);

  readonly roleOptions = [
    { label: 'Técnico',  value: 'TECNICO' },
    { label: 'Vendedor', value: 'VENDEDOR' },
  ];

  readonly form = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    role:       ['TECNICO', Validators.required],
    employeeId: [null as string | null],
  });

  ngOnInit() {
    this.svc.getAll().subscribe(list => this.employees.set(list));
  }

  send() {
    if (this.form.invalid) return;
    this.sending.set(true);
    const raw = this.form.getRawValue();

    this.http.post<{ userId: string; email: string }>(
      `${environment.apiUrl}/employees/invite`,
      { email: raw.email, role: raw.role, employeeId: raw.employeeId || undefined },
    ).subscribe({
      next: res => {
        this.msg.add({
          severity: 'success',
          summary: 'Convite enviado!',
          detail: `E-mail de convite enviado para ${res.email}`,
          life: 5000,
        });
        this.form.reset({ role: 'TECNICO' });
        this.sending.set(false);
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message });
        this.sending.set(false);
      },
    });
  }
}
