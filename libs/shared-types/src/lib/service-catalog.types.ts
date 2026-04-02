export interface ServiceCatalog {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  defaultPrice: number;
  estimatedHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
