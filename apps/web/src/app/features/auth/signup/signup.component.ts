import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, MessageModule, SelectModule],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  loading   = false;
  error     = '';
  success   = false;

  segments = [
    { label: 'Eletrônicos', value: 'electronics' },
    { label: 'Climatização (HVAC)', value: 'hvac' },
    { label: 'Informática', value: 'it' },
    { label: 'Automotivo', value: 'automotive' },
    { label: 'Genérico', value: 'generic' },
  ];

  form = this.fb.group(
    {
      fullName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      companyName:     ['', [Validators.required, Validators.minLength(2)]],
      segment:         ['generic'],
      phone:           [''],
      cnpj:            [''],
    },
    { validators: passwordMatchValidator },
  );

  get mismatch() {
    return this.form.hasError('passwordMismatch') && this.form.get('confirmPassword')?.touched;
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';
    try {
      const { session } = await this.auth.signUp(
        this.form.value.email!,
        this.form.value.password!,
        this.form.value.fullName!,
      );

      if (session) {
        // Session available (email confirmation disabled) — create tenant immediately
        await this.auth.createTenant({
          companyName: this.form.value.companyName!,
          segment:     this.form.value.segment || 'generic',
          phone:       this.form.value.phone   || undefined,
          cnpj:        this.form.value.cnpj    || undefined,
        });
        this.router.navigate(['/app/dashboard']);
      } else {
        // Email confirmation required — tenant will be created after confirmation + login
        this.success = true;
        this.loading = false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      this.error = this.translateError(msg);
      this.loading = false;
    }
  }

  getStrengthScore(): number {
    const pwd = this.form.get('password')?.value ?? '';
    let score = 0;
    if (pwd.length >= 8)                      score++;
    if (pwd.length >= 12)                     score++;
    if (/[A-Z]/.test(pwd) && /\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd))            score++;
    return score;
  }

  getStrengthColor(index: number): string {
    const score = this.getStrengthScore();
    if (index >= score) return 'bg-gray-200';
    if (score === 1)    return 'bg-red-400';
    if (score === 2)    return 'bg-yellow-400';
    if (score === 3)    return 'bg-blue-400';
    return 'bg-green-500';
  }

  getStrengthLabel(): string {
    const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
    return labels[this.getStrengthScore()] ?? '';
  }

  private translateError(msg: string): string {
    if (msg.includes('already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Password should be'))  return 'Senha muito fraca. Use pelo menos 8 caracteres.';
    if (msg.includes('rate limit'))          return 'Muitas tentativas. Aguarde alguns minutos.';
    return 'Erro ao criar conta. Tente novamente.';
  }
}
