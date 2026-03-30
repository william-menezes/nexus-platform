import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { CreateServiceOrderDto } from './create-service-order.dto';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @IsString()
  @IsIn(['open', 'in_progress', 'awaiting_parts', 'done', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceEffective?: number;

  @IsString()
  @IsOptional()
  warrantyUntil?: string;

  @IsString()
  @IsOptional()
  deliveredAt?: string;
}
