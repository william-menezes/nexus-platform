export type ProductType = 'product' | 'part';
export type LookupItemType = 'product' | 'part' | 'service';

export interface ItemCategory {
  id: string;
  tenantId: string;
  itemType: LookupItemType;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ItemBrand {
  id: string;
  tenantId: string;
  itemType: 'product' | 'part';
  name: string;
  createdAt: string;
  deletedAt?: string;
}

export interface ItemQuality {
  id: string;
  tenantId: string;
  itemType: 'product' | 'part';
  name: string;
  level: number;
  createdAt: string;
  deletedAt?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  type: ProductType;
  sku?: string;
  barcode?: string;
  description?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  currentStock: number;
  categoryId?: string;
  category?: ItemCategory;
  brandId?: string;
  brand?: ItemBrand;
  qualityId?: string;
  quality?: ItemQuality;
  supplierId?: string;
  externalRef?: string;
  isActive: boolean;
  belowMinStock?: boolean;
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
  costPrice?: number;
  nfeNumber?: string;
  observation?: string;
  createdAt: string;
}
