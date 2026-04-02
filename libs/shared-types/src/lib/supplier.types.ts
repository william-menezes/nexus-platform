export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  cnpj?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateSupplierPayload {
  name: string;
  cnpj?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: Supplier['address'];
  notes?: string;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;
