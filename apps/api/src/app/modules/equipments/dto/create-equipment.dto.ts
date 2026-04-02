import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreateEquipmentDto {
  @IsUUID()
  equipmentTypeId: string;

  @IsUUID() @IsOptional()
  clientId?: string;

  @IsString() @IsOptional()
  brand?: string;

  @IsString() @IsOptional()
  model?: string;

  @IsObject() @IsOptional()
  fieldsData?: Record<string, unknown>;

  @IsString() @IsOptional()
  notes?: string;
}
