import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsNumber, IsArray, ValidateNested, Min, IsIn, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @IsIn(['product', 'service'])
  itemType: string;

  @IsUUID() @IsOptional()
  productId?: string;

  @IsUUID() @IsOptional()
  serviceId?: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsNumber() @Min(0)
  quantity: number;

  @IsNumber() @Min(0)
  unitPrice: number;

  @IsNumber() @Min(0) @IsOptional()
  discount?: number;

  @IsNumber() @IsOptional()
  sortOrder?: number;
}

export class CreateQuoteDto {
  @IsUUID()
  clientId: string;

  @IsUUID() @IsOptional()
  statusId?: string;

  @IsUUID() @IsOptional()
  employeeId?: string;

  @IsUUID() @IsOptional()
  equipmentId?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsOptional()
  validUntil?: string;

  @IsNumber() @Min(0) @IsOptional()
  discountAmount?: number;

  @IsString() @IsOptional()
  notes?: string;

  @IsObject() @IsOptional()
  customFields?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
