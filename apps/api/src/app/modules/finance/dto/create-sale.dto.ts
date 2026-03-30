import {
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsInt,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class PaymentDto {
  @IsIn(['cash', 'credit', 'debit', 'pix', 'boleto'])
  method: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}
