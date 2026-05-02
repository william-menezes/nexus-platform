import { isValidCpf, isValidCnpj } from './cpf-cnpj.utils';

describe('isValidCpf', () => {
  it('accepts a valid CPF with mask', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('accepts a valid CPF without mask', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('rejects a CPF with wrong check digits', () => {
    expect(isValidCpf('529.982.247-26')).toBe(false);
  });

  it('rejects CPF with all same digits', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('000.000.000-00')).toBe(false);
    expect(isValidCpf('99999999999')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidCpf('')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCpf('123.456.789')).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it('accepts a valid CNPJ with mask', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('accepts a valid CNPJ without mask', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  it('rejects a CNPJ with wrong check digits', () => {
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('rejects CNPJ with all same digits', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidCnpj('')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCnpj('11.222.333/0001')).toBe(false);
  });
});
