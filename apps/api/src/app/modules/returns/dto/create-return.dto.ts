import { Type } from 'class-transformer';
import {
  IsString, IsNotEmpty, IsIn, IsUUID, IsOptional,
  IsArray, ValidateNested, IsNumber, IsInt, Min,
} from 'class-validator';

export class ReturnItemDto {
  @IsUUID() saleItemId: string;
  @IsUUID() @IsOptional() productId?: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsNumber() @Min(0) totalPrice: number;
  @IsUUID() @IsOptional() exchangeProductId?: string;
  @IsInt() @Min(1) @IsOptional() exchangeQuantity?: number;
  @IsNumber() @Min(0) @IsOptional() exchangeUnitPrice?: number;
  @IsNumber() @Min(0) @IsOptional() exchangeTotal?: number;
}

export class CreateReturnDto {
  @IsUUID() saleId: string;
  @IsIn(['refund', 'credit', 'exchange']) type: 'refund' | 'credit' | 'exchange';
  @IsString() @IsNotEmpty() reason: string;
  @IsString() @IsOptional() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ReturnItemDto) items: ReturnItemDto[];
}
