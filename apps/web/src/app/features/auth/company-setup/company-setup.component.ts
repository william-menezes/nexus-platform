import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-company-setup',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule, SelectModule],
  templateUrl: './company-setup.component.html',
  host: { style: 'display: contents;' },
})
export class CompanySetupComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error   = '';

  segments = [
    { label: 'Eletrônicos',       value: 'electronics' },
    { label: 'Climatização (HVAC)', value: 'hvac' },
    { label: 'Informática',       value: 'it' },
    { label: 'Automotivo',        value: 'automotive' },
    { label: 'Genérico',          value: 'generic' },
  ];

  form = this.fb.group({
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    segment:     ['generic'],
    phone:       [''],
    cnpj:        [''],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';
    try {
      await this.auth.createTenant({
        companyName: this.form.value.companyName!,
        segment:     this.form.value.segment    ?? 'generic',
        phone:       this.form.value.phone      || undefined,
        cnpj:        this.form.value.cnpj       || undefined,
      });
      this.router.navigate(['/app/dashboard']);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      this.error = msg.includes('já possui') ? msg : 'Erro ao criar empresa. Tente novamente.';
      this.loading = false;
    }
  }
}
