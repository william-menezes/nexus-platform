import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
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
    BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './tenant-detail.component.html',
})
export class TenantDetailComponent implements OnInit {
  private readonly svc = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly tenant = signal<AdminTenant | null>(null);
  readonly saving = signal(false);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/admin/dashboard' };
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Tenants', routerLink: '/admin/tenants' },
      { label: this.tenant()?.name ?? '...' },
    ];
  }

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
