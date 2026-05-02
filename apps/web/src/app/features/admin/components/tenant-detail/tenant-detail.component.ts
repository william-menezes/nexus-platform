import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AdminService, AdminTenant } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

const PLAN_SEVERITY: Record<string, string> = {
  trial: 'warn', starter: 'info', pro: 'success', enterprise: 'contrast',
};

@Component({
  standalone: true,
  selector: 'app-tenant-detail',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToggleSwitchModule,
    DatePickerModule, CardModule, TagModule, DividerModule,
    ToastModule, TooltipModule, DialogModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tenant-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDetailComponent implements OnInit {
  private readonly svc = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly tenant       = signal<AdminTenant | null>(null);
  readonly saving       = signal(false);
  readonly actioning    = signal(false);
  readonly showExtendDlg = signal(false);
  trialDaysToAdd        = 7;

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
    this.loadTenant(id);
  }

  private loadTenant(id: string) {
    this.svc.findOneTenant(id).subscribe(t => {
      this.tenant.set(t);
      this.breadcrumbSvc.set([
        { label: 'Tenants', routerLink: '/admin/tenants' },
        { label: t.name },
      ]);
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

  openExtendDialog() {
    this.trialDaysToAdd = 7;
    this.showExtendDlg.set(true);
  }

  confirmExtendTrial() {
    if (!this.trialDaysToAdd || this.trialDaysToAdd < 1) return;
    this.actioning.set(true);
    this.showExtendDlg.set(false);
    this.svc.extendTrial(this.tenant()!.id, this.trialDaysToAdd).subscribe({
      next: t => {
        this.tenant.set(t);
        this.actioning.set(false);
        this.msg.add({ severity: 'success', summary: 'Trial estendido', detail: `+${this.trialDaysToAdd} dias adicionados` });
        this.form.patchValue({ trialEndsAt: t.trial_ends_at ? new Date(t.trial_ends_at) : null });
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message });
        this.actioning.set(false);
      },
    });
  }

  confirmRevoke() {
    this.confirm.confirm({
      message: `Deseja revogar a assinatura de "${this.tenant()!.name}"? O tenant perderá acesso imediatamente.`,
      header: 'Revogar Assinatura',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, revogar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.actioning.set(true);
        this.svc.revokeSubscription(this.tenant()!.id).subscribe({
          next: t => {
            this.tenant.set(t);
            this.actioning.set(false);
            this.msg.add({ severity: 'warn', summary: 'Assinatura revogada' });
          },
          error: err => {
            this.msg.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message });
            this.actioning.set(false);
          },
        });
      },
    });
  }
}
