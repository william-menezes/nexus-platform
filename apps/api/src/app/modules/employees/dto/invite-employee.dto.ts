import { IsEmail, IsIn, IsOptional, IsUUID } from 'class-validator';

export class InviteEmployeeDto {
  @IsEmail() email: string;
  @IsIn(['TECNICO', 'VENDEDOR']) role: 'TECNICO' | 'VENDEDOR';
  @IsOptional() @IsUUID() employeeId?: string;
}
