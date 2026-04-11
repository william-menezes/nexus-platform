export interface TenantBranding {
  companyName: string;
  logoUrl?: string;
  phone?: string;
  cnpj?: string;
}

export interface PdfLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
}

export interface QuotePdfData {
  tenant: TenantBranding;
  code: string;
  createdAt: Date;
  validUntil?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  employeeName?: string;
  description?: string;
  items: PdfLineItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  notes?: string;
}

export interface OsPdfData {
  tenant: TenantBranding;
  code: string;
  createdAt: Date;
  clientName: string;
  clientPhone?: string;
  employeeName?: string;
  equipmentInfo?: string;
  description?: string;
  items: PdfLineItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  warrantyUntil?: Date;
  notes?: string;
}

export interface ReceiptPdfData {
  tenant: TenantBranding;
  code: string;
  createdAt: Date;
  clientName?: string;
  items: PdfLineItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  payments: { method: string; amount: number }[];
}
