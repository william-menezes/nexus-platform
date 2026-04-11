import {
  IsUUID, IsIn, IsDateString, IsNumber, IsOptional, IsString,
  IsNotEmpty, Min, Max, ValidateIf,
} from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  clientId: string;

  @IsIn(['fixed', 'hourly_franchise'])
  type: 'fixed' | 'hourly_franchise';

  @IsDateString()
  startDate: string;

  @IsString() @IsOptional()
  description?: string;

  // Obrigatório se type = 'fixed'
  @ValidateIf(o => o.type === 'fixed')
  @IsNumber() @Min(0)
  monthlyValue?: number;

  // Obrigatório se type = 'hourly_franchise'
  @ValidateIf(o => o.type === 'hourly_franchise')
  @IsNumber() @Min(0)
  franchiseHours?: number;

  @ValidateIf(o => o.type === 'hourly_franchise')
  @IsNumber() @Min(0)
  hourExcessPrice?: number;

  @IsDateString() @IsOptional()
  endDate?: string;

  @IsNumber() @Min(1) @Max(28) @IsOptional()
  billingDay?: number;

  @IsNumber() @Min(0) @IsOptional()
  adjustmentRate?: number;

  @IsString() @IsOptional()
  notes?: string;
}
