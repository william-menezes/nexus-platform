export type OsStatus =
  | 'open' | 'in_progress' | 'awaiting_parts' | 'done' | 'cancelled';

export interface ServiceOrder {
  id: string;
  tenantId: string;
  code: string;
  status: OsStatus;
  clientName: string;
  clientPhone?: string;
  description: string;
  customFields: Record<string, unknown>;
  priceIdeal?: number;
  priceEffective?: number;
  deliveredAt?: string;
  warrantyUntil?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
