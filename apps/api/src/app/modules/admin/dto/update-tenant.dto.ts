import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() trialEndsAt?: string;
}
