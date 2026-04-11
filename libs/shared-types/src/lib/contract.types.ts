export interface Contract {
  id: string;
  tenantId: string;
  code: string;
  clientId: string;
  client?: { id: string; name: string };
  clientName?: string;
  type: 'fixed' | 'hourly_franchise';
  status: 'draft' | 'active' | 'suspended' | 'cancelled' | 'expired';
  description?: string;
  monthlyValue?: number;
  franchiseHours?: number;
  hourExcessPrice?: number;
  startDate: string;
  endDate?: string;
  billingDay: number;
  adjustmentRate: number;
  lastAdjustment?: string;
  nextBillingAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractBilling {
  id: string;
  contractId: string;
  periodStart: string;
  periodEnd: string;
  baseAmount: number;
  excessHours: number;
  excessAmount: number;
  totalAmount: number;
  status: 'pending' | 'billed' | 'paid' | 'cancelled';
  billedAt?: string;
  createdAt: string;
}

export interface CreateContractPayload {
  clientId: string;
  type: 'fixed' | 'hourly_franchise';
  description?: string;
  monthlyValue?: number;
  franchiseHours?: number;
  hourExcessPrice?: number;
  startDate: string;
  endDate?: string;
  billingDay?: number;
  adjustmentRate?: number;
  notes?: string;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;
