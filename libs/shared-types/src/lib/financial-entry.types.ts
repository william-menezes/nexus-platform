export interface ChartOfAccount {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'revenue' | 'cost' | 'expense' | 'asset' | 'liability';
  parentId?: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  deletedAt?: string;
}

export interface CostCenter {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  deletedAt?: string;
}

export interface Installment {
  id: string;
  tenantId: string;
  financialEntryId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidAt?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntry {
  id: string;
  tenantId: string;
  type: 'receivable' | 'payable';
  accountId?: string;
  costCenterId?: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  saleId?: string;
  contractId?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  entityType?: 'client' | 'supplier' | 'other';
  entityId?: string;
  entityName?: string;
  notes?: string;
  installments?: Installment[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
