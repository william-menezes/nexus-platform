import { AbstractControl, ValidatorFn } from '@angular/forms';
import { isValidCpf, isValidCnpj } from '@nexus-platform/shared-utils';

const stripDigits = (value: unknown): string =>
  String(value ?? '').replace(/\D/g, '');

export const cpfValidator: ValidatorFn = (control: AbstractControl) =>
  control.value && !isValidCpf(control.value) ? { cpfInvalid: true } : null;

export const cnpjValidator: ValidatorFn = (control: AbstractControl) =>
  control.value && !isValidCnpj(control.value) ? { cnpjInvalid: true } : null;

export const phoneValidator: ValidatorFn = (control: AbstractControl) => {
  const digits = stripDigits(control.value);
  return digits && !/^\d{10,11}$/.test(digits) ? { phoneInvalid: true } : null;
};

export const cepValidator: ValidatorFn = (control: AbstractControl) => {
  const digits = stripDigits(control.value);
  return digits && digits.length !== 8 ? { cepInvalid: true } : null;
};

export const emailValidator: ValidatorFn = (control: AbstractControl) => {
  const value: string = control.value ?? '';
  if (!value) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? null : { emailInvalid: true };
};

export const cpfOrCnpjValidator: ValidatorFn = (control: AbstractControl) => {
  const raw: string = control.value ?? '';
  if (!raw) return null;
  const digits = stripDigits(raw);
  if (digits.length === 11) return isValidCpf(raw) ? null : { cpfInvalid: true };
  if (digits.length === 14) return isValidCnpj(raw) ? null : { cnpjInvalid: true };
  return { cpfCnpjInvalid: true };
};

export const VALIDATOR_MESSAGES: Record<string, string> = {
  required:      'Campo obrigatório',
  minlength:     'Muito curto',
  maxlength:     'Muito longo',
  email:         'E-mail inválido',
  emailInvalid:  'E-mail inválido',
  cpfInvalid:    'CPF inválido',
  cnpjInvalid:   'CNPJ inválido',
  cpfCnpjInvalid:'CPF/CNPJ inválido',
  phoneInvalid:  'Telefone inválido',
  cepInvalid:    'CEP inválido',
};

export function getFirstError(control: AbstractControl | null): string {
  if (!control?.errors) return '';
  const key = Object.keys(control.errors)[0];
  return VALIDATOR_MESSAGES[key] ?? 'Campo inválido';
}
