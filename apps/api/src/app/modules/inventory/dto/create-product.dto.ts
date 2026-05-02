import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsUUID, IsIn, IsBoolean, IsInt, Min,
} from 'class-validator';
import { ProductType } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsIn(['product', 'part'])
  type?: ProductType;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsInt()
  @Min(0)
  minStock: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  qualityId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  externalRef?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
