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
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address: ClientAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
