import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AdminService, AdminCoupon } from '../../admin.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

@Component({
  standalone: true,
  selector: 'app-coupon-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule,
    DatePickerModule, ToggleSwitchModule, ToastModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './coupon-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouponFormComponent implements OnInit {
  private readonly svc          = inject(AdminService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly msg          = inject(MessageService);
  private readonly fb           = inject(FormBuilder);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly couponId = signal<string | null>(null);
  readonly saving   = signal(false);
  readonly loading  = signal(false);

  readonly typeOptions = [
    { label: 'Percentual (%)', value: 'percentage' },
    { label: 'Valor fixo (R$)', value: 'fixed' },
  ];

  readonly form = this.fb.group({
    code:       ['', [Validators.required, Validators.minLength(3)]],
    type:       ['percentage' as 'percentage' | 'fixed', Validators.required],
    value:      [0, [Validators.required, Validators.min(0.01)]],
    valid_until:[null as Date | null],
    max_uses:   [null as number | null],
    is_active:  [true],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.couponId.set(id);

    if (id) {
      this.breadcrumbSvc.set([
        { label: 'Cupons', routerLink: '/admin/cupons' },
        { label: 'Carregando...' },
      ]);
      this.loading.set(true);
      this.svc.getCoupons().subscribe({
        next: coupons => {
          const coupon = coupons.find(c => c.id === id);
          if (coupon) {
            this.breadcrumbSvc.set([
              { label: 'Cupons', routerLink: '/admin/cupons' },
              { label: coupon.code },
            ]);
            this.form.patchValue({
              code:        coupon.code,
              type:        coupon.type,
              value:       coupon.value,
              valid_until: coupon.valid_until ? new Date(coupon.valid_until) : null,
              max_uses:    coupon.max_uses,
              is_active:   coupon.is_active,
            });
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.breadcrumbSvc.set([
        { label: 'Cupons', routerLink: '/admin/cupons' },
        { label: 'Novo' },
      ]);
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      code:        raw.code!.toUpperCase(),
      type:        raw.type! as 'percentage' | 'fixed',
      value:       raw.value ?? 0,
      valid_until: raw.valid_until ? (raw.valid_until as Date).toISOString() : null,
      max_uses:    raw.max_uses ?? null,
      is_active:   raw.is_active ?? true,
    };

    const req$ = this.couponId()
      ? this.svc.updateCoupon(this.couponId()!, dto)
      : this.svc.createCoupon(dto);

    req$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: this.couponId() ? 'Cupom atualizado' : 'Cupom criado' });
        this.saving.set(false);
        this.router.navigate(['/admin/cupons']);
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
