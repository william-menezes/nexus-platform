import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReceiveItemDto {
  @IsUUID() purchaseItemId: string;
  @IsNumber() @Min(0.001) quantityReceived: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ReceiveItemDto) items: ReceiveItemDto[];
}
