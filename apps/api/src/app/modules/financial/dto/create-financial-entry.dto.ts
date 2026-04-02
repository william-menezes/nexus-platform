import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsNumber, IsBoolean, IsIn, Min,
} from 'class-validator';

export class CreateFinancialEntryDto {
  @IsIn(['receivable', 'payable'])
  type: string;

  @IsUUID() @IsOptional()
  accountId?: string;

  @IsUUID() @IsOptional()
  costCenterId?: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsNumber() @Min(0.01)
  totalAmount: number;

  @IsString() @IsNotEmpty()
  dueDate: string;

  @IsNumber() @Min(1) @IsOptional()
  installmentCount?: number;

  @IsIn(['client', 'supplier', 'other']) @IsOptional()
  entityType?: string;

  @IsUUID() @IsOptional()
  entityId?: string;

  @IsString() @IsOptional()
  entityName?: string;

  @IsBoolean() @IsOptional()
  isRecurring?: boolean;

  @IsString() @IsOptional()
  notes?: string;
}

export class PayInstallmentDto {
  @IsNumber() @Min(0.01)
  paidAmount: number;

  @IsIn(['cash', 'credit', 'debit', 'pix', 'boleto', 'transfer'])
  paymentMethod: string;

  @IsString() @IsOptional()
  notes?: string;
}

export class CreateChartOfAccountDto {
  @IsString() @IsNotEmpty()
  code: string;

  @IsString() @IsNotEmpty()
  name: string;

  @IsIn(['revenue', 'cost', 'expense', 'asset', 'liability'])
  type: string;

  @IsUUID() @IsOptional()
  parentId?: string;

  @IsNumber() @IsOptional()
  sortOrder?: number;
}

export class CreateCostCenterDto {
  @IsString() @IsNotEmpty()
  name: string;
}

export class OpenCashSessionDto {
  @IsUUID()
  cashRegisterId: string;

  @IsNumber() @Min(0)
  openingAmount: number;

  @IsString() @IsOptional()
  notes?: string;
}

export class CloseCashSessionDto {
  @IsNumber() @Min(0)
  closingAmount: number;

  @IsString() @IsOptional()
  notes?: string;
}

export class CreateCashMovementDto {
  @IsIn(['receipt', 'withdrawal', 'expense', 'adjustment'])
  type: string;

  @IsNumber() @Min(0.01)
  amount: number;

  @IsString() @IsNotEmpty()
  description: string;

  @IsString() @IsOptional()
  notes?: string;
}
