import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Quote } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/quotes`;

  getAll(statusId?: string, clientId?: string) {
    let params = new HttpParams();
    if (statusId) params = params.set('statusId', statusId);
    if (clientId) params = params.set('clientId', clientId);
    return this.http.get<Quote[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Quote>(`${this.base}/${id}`);
  }

  create(dto: Partial<Quote>) {
    return this.http.post<Quote>(this.base, dto);
  }

  update(id: string, dto: Partial<Quote>) {
    return this.http.patch<Quote>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  send(id: string) {
    return this.http.post<Quote>(`${this.base}/${id}/send`, {});
  }

  approve(id: string) {
    return this.http.post<Quote>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, reason: string) {
    return this.http.post<Quote>(`${this.base}/${id}/reject`, { rejectionReason: reason });
  }

  convertToOs(id: string) {
    return this.http.post<Quote>(`${this.base}/${id}/convert-to-os`, {});
  }
}
