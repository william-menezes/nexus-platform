import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsIn, IsBoolean, IsInt, Min, IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  code: string;

  @IsIn(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_uses?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
