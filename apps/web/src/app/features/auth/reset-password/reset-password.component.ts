import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value as string | undefined;
  const confirm  = control.get('passwordConfirm')?.value as string | undefined;
  if (password && confirm && password !== confirm) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './reset-password.component.html',
  host: { style: 'display: contents;' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly fb             = inject(FormBuilder);
  private readonly auth           = inject(AuthService);
  private readonly router         = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cdr            = inject(ChangeDetectorRef);

  loading = false;
  error   = '';

  form = this.fb.group(
    {
      password:        ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';
    try {
      await this.auth.updatePassword(this.form.value.password!);
      this.messageService.add({
        severity: 'success',
        summary:  'Senha redefinida com sucesso!',
        life:     4000,
      });
      void this.router.navigate(['/app/dashboard']);
    } catch (e: unknown) {
      const msg = ((e as { message?: string })?.message ?? '').toLowerCase();
      if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
        this.error = 'Link expirado. Solicite um novo e-mail de recuperação.';
        setTimeout(() => void this.router.navigate(['/esqueci-senha']), 2500);
      } else {
        this.error = 'Erro ao redefinir a senha. Tente novamente.';
      }
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
