import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateServiceOrderDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

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
