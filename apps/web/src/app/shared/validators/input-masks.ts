export const MASKS = {
  CPF:       '999.999.999-99',
  CNPJ:      '99.999.999/9999-99',
  CEP:       '99999-999',
  PHONE:     '(99) 9999-9999',
  PHONE_CEL: '(99) 99999-9999',
} as const;

/**
 * Retorna a máscara de telefone correta baseada nos dígitos já digitados.
 * Use no [mask] do p-inputmask com (onInput) para atualizar dinamicamente.
 */
export function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10 ? MASKS.PHONE_CEL : MASKS.PHONE;
}
