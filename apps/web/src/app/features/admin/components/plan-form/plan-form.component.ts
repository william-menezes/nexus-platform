import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminService, AdminPlan } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

export interface ModuleOption {
  value: string;
  label: string;
}

export const MODULE_OPTIONS: ModuleOption[] = [
  { value: 'clients',        label: 'Clientes' },
  { value: 'service_orders', label: 'Ordens de Serviço' },
  { value: 'sales',          label: 'Vendas' },
  { value: 'inventory',      label: 'Estoque' },
  { value: 'financial',      label: 'Financeiro' },
  { value: 'contracts',      label: 'Contratos' },
  { value: 'reports',        label: 'Relatórios' },
  { value: 'settings',       label: 'Configurações' },
];

@Component({
  standalone: true,
  selector: 'app-plan-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, InputNumberModule, TextareaModule,
    ToggleSwitchModule, CheckboxModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './plan-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanFormComponent implements OnInit {
  private readonly svc          = inject(AdminService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly msg          = inject(MessageService);
  private readonly fb           = inject(FormBuilder);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly planId       = signal<string | null>(null);
  readonly saving       = signal(false);
  readonly loading      = signal(false);
  readonly moduleOptions = MODULE_OPTIONS;

  readonly form = this.fb.group({
    name:        ['', Validators.required],
    slug:        ['', Validators.required],
    description: [''],
    price:       [0, [Validators.required, Validators.min(0)]],
    sort_order:  [0],
    is_active:   [true],
    max_os:      [100],
    max_users:   [3],
    modules:     [[] as string[]],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.planId.set(id);

    if (id) {
      this.breadcrumbSvc.set([
        { label: 'Planos', routerLink: '/admin/planos' },
        { label: 'Carregando...' },
      ]);
      this.loading.set(true);
      this.svc.getPlans().subscribe({
        next: plans => {
          const plan = plans.find(p => p.id === id);
          if (plan) {
            this.breadcrumbSvc.set([
              { label: 'Planos', routerLink: '/admin/planos' },
              { label: plan.name },
            ]);
            this.form.patchValue({
              name:        plan.name,
              slug:        plan.slug,
              description: plan.description ?? '',
              price:       plan.price,
              sort_order:  plan.sort_order,
              is_active:   plan.is_active,
              max_os:      plan.limits?.max_os ?? 0,
              max_users:   plan.limits?.max_users ?? 0,
              modules:     plan.modules ?? [],
            });
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.breadcrumbSvc.set([
        { label: 'Planos', routerLink: '/admin/planos' },
        { label: 'Novo' },
      ]);
    }
  }

  toggleModule(value: string) {
    const current = this.form.controls.modules.value ?? [];
    const updated = current.includes(value)
      ? current.filter(m => m !== value)
      : [...current, value];
    this.form.controls.modules.setValue(updated);
  }

  isModuleSelected(value: string): boolean {
    return (this.form.controls.modules.value ?? []).includes(value);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto: Omit<AdminPlan, 'id'> = {
      name:        raw.name!,
      slug:        raw.slug!,
      description: raw.description || null,
      price:       raw.price ?? 0,
      sort_order:  raw.sort_order ?? 0,
      is_active:   raw.is_active ?? true,
      modules:     raw.modules ?? [],
      limits: {
        max_os:    raw.max_os || null,
        max_users: raw.max_users || null,
      },
    };

    const req$ = this.planId()
      ? this.svc.updatePlan(this.planId()!, dto)
      : this.svc.createPlan(dto);

    req$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: this.planId() ? 'Plano atualizado' : 'Plano criado' });
        this.saving.set(false);
        this.router.navigate(['/admin/planos']);
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
