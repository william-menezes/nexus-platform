import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Sale, DreEntry } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/finance`;

  getSales()                    { return this.http.get<Sale[]>(`${this.base}/sales`); }
  getSale(id: string)           { return this.http.get<Sale>(`${this.base}/sales/${id}`); }
  createSale(dto: Partial<Sale> & { items: unknown[]; payments: unknown[] }) {
    return this.http.post<Sale>(`${this.base}/sales`, dto);
  }
  cancelSale(id: string)        { return this.http.post<Sale>(`${this.base}/sales/${id}/cancel`, {}); }

  getDre(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<DreEntry[]>(`${this.base}/dre`, { params });
  }

  sendWhatsapp(phone: string, message: string) {
    return this.http.post<boolean>(`${this.base}/whatsapp/send`, { phone, message });
  }
}
