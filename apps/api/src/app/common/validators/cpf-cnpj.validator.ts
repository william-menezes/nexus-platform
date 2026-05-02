import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isValidCpf, isValidCnpj } from '@nexus-platform/shared-utils';

export function IsCpfValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCpfValid',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: { message: 'CPF inválido', ...validationOptions },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (value === undefined || value === null || value === '') return true;
          return typeof value === 'string' && isValidCpf(value);
        },
      },
    });
  };
}

export function IsCnpjValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCnpjValid',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: { message: 'CNPJ inválido', ...validationOptions },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (value === undefined || value === null || value === '') return true;
          return typeof value === 'string' && isValidCnpj(value);
        },
      },
    });
  };
}
