import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './forgot-password.component.html',
  host: { style: 'display: contents;' },
})
export class ForgotPasswordComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  loading = false;
  error   = '';
  success = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';
    try {
      await this.auth.resetPassword(this.form.value.email!);
      this.success = true;
    } catch {
      this.error = 'Não foi possível enviar o e-mail. Tente novamente.';
    } finally {
      this.loading = false;
    }
  }
}
