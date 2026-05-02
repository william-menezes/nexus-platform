import { ItemCategory } from './inventory.types';

export interface ServiceCatalog {
  id: string;
  tenantId: string;
  name: string;
  categoryId?: string;
  category?: ItemCategory;
  description?: string;
  defaultPrice: number;
  estimatedHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
