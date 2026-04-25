import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, MessageModule],
  templateUrl: './login.component.html',
  host: { style: 'display: contents;' },
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  loading  = false;
  error    = '';

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';
    try {
      await this.auth.signIn(
        this.form.value.email ?? '',
        this.form.value.password ?? '',
      );
      const me = await this.auth.refreshMe();
      if (me?.role === 'SUPER_ADMIN') this.router.navigate(['/admin/dashboard']);
      else this.router.navigate(['/app/dashboard']);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      this.error = this.translateError(msg);
      this.loading = false;
    }
  }

  private translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed'))        return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('too many requests'))          return 'Muitas tentativas. Aguarde alguns minutos.';
    return 'Erro ao fazer login. Tente novamente.';
  }
}
