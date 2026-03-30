export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku?: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  currentStock: number;
  category?: string;
  externalRef?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type StockEntryType = 'in' | 'out';

export interface StockEntry {
  id: string;
  tenantId: string;
  productId: string;
  serviceOrderId?: string;
  type: StockEntryType;
  quantity: number;
  nfeNumber?: string;
  observation?: string;
  createdAt: string;
}
