import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateServiceOrderDto {
  // Phase 1: FK to clients table (preferred)
  @IsUUID()
  @IsOptional()
  clientId?: string;

  // Phase 1: FK to custom_statuses
  @IsUUID()
  @IsOptional()
  statusId?: string;

  // Phase 1: FK to employees
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  // Legacy: kept for backward compat
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceIdeal?: number;
}
