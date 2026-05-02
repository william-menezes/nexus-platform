import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ItemBrandType } from '../entities/item-brand.entity';

export class CreateItemBrandDto {
  @IsIn(['product', 'part'])
  itemType: ItemBrandType;

  @IsString()
  @IsNotEmpty()
  name: string;
}
