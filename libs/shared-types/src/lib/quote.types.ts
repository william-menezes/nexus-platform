export interface QuoteItem {
  id: string;
  quoteId: string;
  itemType: 'product' | 'service';
  productId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  code: string;
  clientId: string;
  statusId: string;
  employeeId?: string;
  equipmentId?: string;
  description?: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  validUntil?: string;
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  convertedToOsId?: string;
  notes?: string;
  customFields: Record<string, unknown>;
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
