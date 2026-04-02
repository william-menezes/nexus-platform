export interface EquipmentFieldSchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
}

export interface EquipmentType {
  id: string;
  tenantId: string;
  name: string;
  fieldsSchema: EquipmentFieldSchema[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Equipment {
  id: string;
  tenantId: string;
  equipmentTypeId: string;
  clientId?: string;
  brand?: string;
  model?: string;
  fieldsData: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
