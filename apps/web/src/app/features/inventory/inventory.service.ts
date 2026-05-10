import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, StockEntry, ProductType } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/inventory`;

  // Produtos
  getProducts(type?: ProductType, activeOnly?: boolean) {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (activeOnly) params = params.set('activeOnly', 'true');
    return this.http.get<Product[]>(`${this.base}/products`, { params });
  }

  getProduct(id: string)                     { return this.http.get<Product>(`${this.base}/products/${id}`); }
  getProductByBarcode(barcode: string)       { return this.http.get<Product>(`${this.base}/products/barcode/${encodeURIComponent(barcode)}`); }
  createProduct(dto: Partial<Product>)       { return this.http.post<Product>(`${this.base}/products`, dto); }
  updateProduct(id: string, dto: Partial<Product>) { return this.http.patch<Product>(`${this.base}/products/${id}`, dto); }
  removeProduct(id: string)                  { return this.http.delete(`${this.base}/products/${id}`); }

  // Movimentações
  getEntries(productId: string)              { return this.http.get<StockEntry[]>(`${this.base}/products/${productId}/entries`); }
  createEntry(dto: Partial<StockEntry>)      { return this.http.post<StockEntry>(`${this.base}/entries`, dto); }

  // NF-e Import
  importNfe(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ imported: number; created: number; matched: number }>(`${this.base}/nfe-import`, form);
  }
}
