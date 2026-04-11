export interface ReturnItem {
  id: string;
  returnId: string;
  saleItemId: string;
  productId?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stockReturned: boolean;
  exchangeProductId?: string;
  exchangeQuantity?: number;
  exchangeUnitPrice?: number;
  exchangeTotal?: number;
}

export interface Return {
  id: string;
  tenantId: string;
  saleId: string;
  saleCode?: string;
  code: string;
  type: 'refund' | 'credit' | 'exchange';
  reason: string;
  totalAmount: number;
  creditAmount: number;
  refundAmount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  processedBy?: string;
  notes?: string;
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnPayload {
  saleId: string;
  type: 'refund' | 'credit' | 'exchange';
  reason: string;
  notes?: string;
  items: {
    saleItemId: string;
    quantity: number;
    exchangeProductId?: string;
    exchangeQuantity?: number;
    exchangeUnitPrice?: number;
  }[];
}
