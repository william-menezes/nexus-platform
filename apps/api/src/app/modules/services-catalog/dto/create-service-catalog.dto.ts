import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateServiceCatalogDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsNumber() @Min(0) @IsOptional()
  defaultPrice?: number;

  @IsNumber() @Min(0) @IsOptional()
  estimatedHours?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
