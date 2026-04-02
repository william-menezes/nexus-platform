import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateQuoteDto } from './create-quote.dto';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}

export class RejectQuoteDto {
  @IsString() @IsNotEmpty()
  rejectionReason: string;
}
