import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Return, CreateReturnPayload } from '@nexus-platform/shared-types';

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/returns`;

  findAll(status?: string) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<Return[]>(this.base, { params });
  }

  findOne(id: string) {
    return this.http.get<Return>(`${this.base}/${id}`);
  }

  create(payload: CreateReturnPayload) {
    return this.http.post<Return>(this.base, payload);
  }

  approve(id: string) {
    return this.http.patch<Return>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, reason = 'Devolução rejeitada') {
    return this.http.patch<Return>(`${this.base}/${id}/reject`, { reason });
  }

  returnToStock(returnId: string, itemId: string) {
    return this.http.post<Return>(`${this.base}/${returnId}/items/${itemId}/stock`, {});
  }
}
