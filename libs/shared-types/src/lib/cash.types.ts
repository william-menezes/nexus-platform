export interface CashRegister {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  tenantId: string;
  cashSessionId: string;
  type: 'sale' | 'receipt' | 'withdrawal' | 'expense' | 'adjustment';
  amount: number;
  description: string;
  saleId?: string;
  createdBy: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  openedBy: string;
  closedBy?: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  notes?: string;
  movements?: CashMovement[];
}
