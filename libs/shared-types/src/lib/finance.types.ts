export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';
export type SaleStatus = 'open' | 'paid' | 'cancelled';

export interface SaleItem {
  id: string;
  saleId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  asaasChargeId?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  tenantId: string;
  serviceOrderId?: string;
  total: number;
  discountAmount: number;
  paidAmount: number;
  status: SaleStatus;
  items?: SaleItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface DreEntry {
  month: string;       // 'YYYY-MM'
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  grossMargin: number; // percentual 0–1
}

export interface SalesByProductEntry {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
}

export interface SalesByEmployeeEntry {
  employeeId: string | null;
  employeeName: string;
  salesCount: number;
  totalRevenue: number;
}

export interface SalesByPaymentEntry {
  method: string;
  methodLabel: string;
  count: number;
  totalAmount: number;
  percentage: number; // 0–1
}
