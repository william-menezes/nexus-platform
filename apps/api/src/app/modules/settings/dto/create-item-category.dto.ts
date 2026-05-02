import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ItemCategoryType } from '../entities/item-category.entity';

export class CreateItemCategoryDto {
  @IsIn(['product', 'part', 'service'])
  itemType: ItemCategoryType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
