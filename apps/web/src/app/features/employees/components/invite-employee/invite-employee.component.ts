import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Employee } from '@nexus-platform/shared-types';
import { EmployeesService } from '../../employees.service';

@Component({
  standalone: true,
  selector: 'app-invite-employee',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, SelectModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-2xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/funcionarios" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">Convidar Funcionário</h1>
      </div>

      <p-card>
        <p class="text-sm text-gray-500 mb-4">
          O funcionário receberá um e-mail de convite para criar sua senha e acessar o sistema.
        </p>

        <form [formGroup]="form" (ngSubmit)="send()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium">E-mail *</label>
            <input pInputText formControlName="email" type="email"
              placeholder="funcionario@empresa.com" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-medium">Perfil de acesso *</label>
            <p-select formControlName="role" [options]="roleOptions"
              optionLabel="label" optionValue="value"
              placeholder="Selecione o perfil" styleClass="w-full" />
            <p class="text-xs text-gray-400 mt-1">
              <strong>Técnico:</strong> acessa OS, clientes, equipamentos e orçamentos.<br>
              <strong>Vendedor:</strong> acessa vendas, caixa e devoluções.
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-medium">Vincular a funcionário existente <span class="text-gray-400 font-normal">(opcional)</span></label>
            <p-select formControlName="employeeId" [options]="employees()"
              optionLabel="name" optionValue="id"
              placeholder="Selecionar funcionário do cadastro"
              [showClear]="true" [filter]="true" filterBy="name"
              styleClass="w-full" />
            <p class="text-xs text-gray-400 mt-1">
              Se selecionado, o login será vinculado ao cadastro de funcionário.
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <a routerLink="/app/funcionarios" pButton label="Cancelar"
              class="p-button-outlined p-button-sm"></a>
            <button pButton type="submit" label="Enviar Convite"
              icon="pi pi-envelope" class="p-button-sm"
              [disabled]="form.invalid || sending()"></button>
          </div>
        </form>
      </p-card>
    </div>
  `,
})
export class InviteEmployeeComponent implements OnInit {
  private readonly svc = inject(EmployeesService);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

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
