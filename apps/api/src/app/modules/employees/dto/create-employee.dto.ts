import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsOptional()
  roleLabel?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsUUID() @IsOptional()
  userId?: string;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  commissionRate?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
