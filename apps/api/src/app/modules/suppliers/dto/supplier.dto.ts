import { IsString, IsOptional, IsEmail, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() @IsString() cnpj?: string;
  @IsOptional() @IsString() contact?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsObject() address?: Record<string, unknown>;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
