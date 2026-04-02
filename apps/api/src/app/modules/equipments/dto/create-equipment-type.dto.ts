import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateEquipmentTypeDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsArray() @IsOptional()
  fieldsSchema?: object[];
}
