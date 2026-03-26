export type TenantPlan = 'starter' | 'pro' | 'enterprise';
export type TenantRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  planLimits: { maxOs: number; maxUsers: number; maxUnits: number; };
  isActive: boolean;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  createdAt: string;
}
