export interface ClientAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  type: 'individual' | 'company';
  cpf?: string;
  cnpj?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  birthDate?: string;
  gender?: 'M' | 'F' | 'other';
  address?: ClientAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ClientHistoryItem {
  id: string;
  code: string;
  status: string | null;
  createdAt: string;
  type: 'os' | 'quote';
}

export interface ClientHistory {
  serviceOrders: ClientHistoryItem[];
  quotes: ClientHistoryItem[];
}

export interface ClientSummary {
  openOrders: number;
  closedOrders: number;
  totalBilled: number;
  pendingBalance: number;
}

export interface ClientSaleItem {
  id: string;
  code?: string;
  status: 'open' | 'paid' | 'cancelled';
  total: number;
  createdAt: string;
}

export interface ClientEquipmentItem {
  id: string;
  equipmentTypeId: string;
  brand?: string;
  model?: string;
  createdAt: string;
}
