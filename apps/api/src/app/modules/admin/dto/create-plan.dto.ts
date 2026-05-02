import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsArray, IsObject, IsInt, Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @IsString({ each: true })
  modules: string[];

  @IsObject()
  limits: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
