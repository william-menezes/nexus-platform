import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminService, AdminTenant } from '../../admin.service';

const PLAN_SEVERITY: Record<string, string> = {
  trial: 'warn', starter: 'info', pro: 'success', enterprise: 'contrast',
};

@Component({
  standalone: true,
  selector: 'app-tenant-detail',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule,
    DatePickerModule, CardModule, TagModule, DividerModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-3xl mx-auto" *ngIf="tenant(); else loadingTpl">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/admin/tenants" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm" aria-label="Voltar"></a>
        <h1 class="text-2xl font-bold">{{ tenant()!.name }}</h1>
        <p-tag [value]="tenant()!.plan" [severity]="planSeverity(tenant()!.plan)" />
        <p-tag [value]="tenant()!.is_active ? 'Ativo' : 'Inativo'"
          [severity]="tenant()!.is_active ? 'success' : 'danger'" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <p-card header="Informações">
          <div class="text-sm flex flex-col gap-2">
            <div class="flex justify-between">
              <span class="text-gray-500">Slug</span>
              <span class="font-mono text-xs">{{ tenant()!.slug }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Segmento</span>
              <span class="capitalize">{{ tenant()!.segment || '—' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="tenant()!.cnpj">
              <span class="text-gray-500">CNPJ</span>
              <span>{{ tenant()!.cnpj }}</span>
            </div>
            <div class="flex justify-between" *ngIf="tenant()!.phone">
              <span class="text-gray-500">Telefone</span>
              <span>{{ tenant()!.phone }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Criado em</span>
              <span>{{ tenant()!.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="tenant()!.user_count !== undefined">
              <span class="text-gray-500">Usuários</span>
              <span>{{ tenant()!.user_count }}</span>
            </div>
          </div>
        </p-card>

        <p-card header="Editar Tenant">
          <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Plano</label>
              <p-select formControlName="plan" [options]="planOptions"
                optionLabel="label" optionValue="value" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Trial até</label>
              <p-datepicker formControlName="trialEndsAt" dateFormat="dd/mm/yy"
                [showIcon]="true" [showClear]="true" styleClass="w-full" />
            </div>

            <div class="flex items-center gap-3">
              <p-toggleswitch formControlName="isActive" />
              <label class="text-sm font-medium">Tenant ativo</label>
            </div>

            <div class="flex justify-end">
              <button pButton type="submit" label="Salvar"
                icon="pi pi-check" class="p-button-sm"
                [disabled]="saving()"></button>
            </div>
          </form>
        </p-card>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="nx-page flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
      </div>
    </ng-template>
  `,
})
export class TenantDetailComponent implements OnInit {
  private readonly svc = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly tenant = signal<AdminTenant | null>(null);
  readonly saving = signal(false);

  readonly planOptions = [
    { label: 'Trial',      value: 'trial' },
    { label: 'Starter',    value: 'starter' },
    { label: 'Pro',        value: 'pro' },
    { label: 'Enterprise', value: 'enterprise' },
  ];

  readonly form = this.fb.group({
    plan:         ['trial'],
    isActive:     [true],
    trialEndsAt:  [null as Date | null],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.findOneTenant(id).subscribe(t => {
      this.tenant.set(t);
      this.form.patchValue({
        plan: t.plan,
        isActive: t.is_active,
        trialEndsAt: t.trial_ends_at ? new Date(t.trial_ends_at) : null,
      });
    });
  }

  planSeverity(plan: string): any { return PLAN_SEVERITY[plan] ?? 'secondary'; }

  save() {
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: any = {
      plan: raw.plan,
      isActive: raw.isActive,
      trialEndsAt: raw.trialEndsAt ? (raw.trialEndsAt as Date).toISOString() : undefined,
    };

    this.svc.updateTenant(this.tenant()!.id, payload).subscribe({
      next: t => {
        this.tenant.set(t);
        this.saving.set(false);
        this.msg.add({ severity: 'success', summary: 'Tenant atualizado' });
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
