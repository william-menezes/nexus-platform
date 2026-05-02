import {
  IsString, IsNotEmpty, IsOptional, IsObject, IsIn, IsEmail,
  IsDateString,
} from 'class-validator';
import { IsCpfValid, IsCnpjValid } from '../../../common/validators/cpf-cnpj.validator';

export class CreateClientDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsIn(['individual', 'company'])
  @IsOptional()
  type?: 'individual' | 'company';

  @IsOptional()
  @IsCpfValid()
  cpf?: string;

  @IsOptional()
  @IsCnpjValid()
  cnpj?: string;

  @IsDateString() @IsOptional()
  birthDate?: string;

  @IsIn(['M', 'F', 'other']) @IsOptional()
  gender?: 'M' | 'F' | 'other';

  @IsEmail() @IsOptional()
  email?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsString() @IsOptional()
  phone2?: string;

  @IsObject() @IsOptional()
  address?: Record<string, unknown> | null;

  @IsString() @IsOptional()
  notes?: string;
}
