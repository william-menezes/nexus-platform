export interface Employee {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  roleLabel?: string;
  phone?: string;
  email?: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
