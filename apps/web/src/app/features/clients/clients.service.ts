import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Client, ClientHistory, ClientSummary, ClientSaleItem, ClientEquipmentItem,
} from '@nexus-platform/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clients`;

  getAll(search?: string) {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Client[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(dto: Partial<Client>) {
    return this.http.post<Client>(this.base, dto);
  }

  update(id: string, dto: Partial<Client>) {
    return this.http.patch<Client>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  getHistory(id: string): Observable<ClientHistory> {
    return this.http.get<ClientHistory>(`${this.base}/${id}/history`);
  }

  getSummary(id: string): Observable<ClientSummary> {
    return this.http.get<ClientSummary>(`${this.base}/${id}/summary`);
  }

  getSales(id: string): Observable<ClientSaleItem[]> {
    return this.http.get<ClientSaleItem[]>(`${this.base}/${id}/sales`);
  }

  getEquipments(id: string): Observable<ClientEquipmentItem[]> {
    return this.http.get<ClientEquipmentItem[]>(`${this.base}/${id}/equipments`);
  }
}
