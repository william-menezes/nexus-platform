import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  PurchaseOrder,
  CreatePurchaseOrderPayload,
  ReceivePurchaseOrderPayload,
} from '@nexus-platform/shared-types';

@Injectable({ providedIn: 'root' })
export class PurchaseOrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/purchase-orders`;

  findAll(status?: string) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<PurchaseOrder[]>(this.base, { params });
  }

  findOne(id: string) {
    return this.http.get<PurchaseOrder>(`${this.base}/${id}`);
  }

  create(payload: CreatePurchaseOrderPayload) {
    return this.http.post<PurchaseOrder>(this.base, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  receive(id: string, payload: ReceivePurchaseOrderPayload) {
    return this.http.post<PurchaseOrder>(`${this.base}/${id}/receive`, payload);
  }
}
