import {
  IsString, IsNotEmpty, IsOptional, IsObject, IsIn, IsEmail,
} from 'class-validator';

export class CreateClientDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsIn(['individual', 'company'])
  @IsOptional()
  type?: 'individual' | 'company';

  @IsString() @IsOptional()
  cpfCnpj?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsString() @IsOptional()
  phone2?: string;

  @IsObject() @IsOptional()
  address?: Record<string, unknown>;

  @IsString() @IsOptional()
  notes?: string;
}
