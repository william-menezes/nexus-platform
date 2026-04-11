import { Type } from 'class-transformer';
import {
  IsUUID, IsDateString, IsOptional, IsString,
  IsNumber, Min, IsArray, ValidateNested,
} from 'class-validator';

export class PurchaseItemDto {
  @IsUUID() productId: string;
  @IsNumber() @Min(0.001) quantity: number;
  @IsNumber() @Min(0) unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID() supplierId: string;
  @IsDateString() @IsOptional() expectedAt?: string;
  @IsNumber() @Min(0) @IsOptional() discount?: number;
  @IsNumber() @Min(0) @IsOptional() shippingCost?: number;
  @IsString() @IsOptional() nfeNumber?: string;
  @IsString() @IsOptional() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseItemDto) items: PurchaseItemDto[];
}
