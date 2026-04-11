export interface PurchaseItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: { id: string; name: string };
  productName?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  quantityReceived: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  code: string;
  supplierId: string;
  supplier?: { id: string; name: string };
  supplierName?: string;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  expectedAt?: string;
  receivedAt?: string;
  nfeNumber?: string;
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  expectedAt?: string;
  discount?: number;
  shippingCost?: number;
  nfeNumber?: string;
  notes?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}

export interface ReceivePurchaseOrderPayload {
  items: { purchaseItemId: string; quantityReceived: number }[];
}
