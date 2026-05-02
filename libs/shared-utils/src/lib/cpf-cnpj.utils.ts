function stripMask(value: string): string {
  return value.replace(/\D/g, '');
}

function allSameDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function isValidCpf(cpf: string): boolean {
  const digits = stripMask(cpf);
  if (digits.length !== 11 || allSameDigits(digits)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(digits.slice(0, 9), w1);
  const d2 = calcDigit(digits.slice(0, 10), w2);

  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = stripMask(cnpj);
  if (digits.length !== 14 || allSameDigits(digits)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(digits.slice(0, 12), w1);
  const d2 = calcDigit(digits.slice(0, 13), w2);

  return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}
