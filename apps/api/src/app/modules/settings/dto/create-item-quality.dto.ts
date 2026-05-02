import { IsString, IsNotEmpty, IsIn, IsOptional, IsInt, Min } from 'class-validator';
import { ItemQualityType } from '../entities/item-quality.entity';

export class CreateItemQualityDto {
  @IsIn(['product', 'part'])
  itemType: ItemQualityType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;
}
