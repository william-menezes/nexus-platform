import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsIn,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateStockEntryDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsIn(['in', 'out'])
  type: 'in' | 'out';

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  nfeNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  observation?: string;
}
