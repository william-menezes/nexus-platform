import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TenantSettings {
  id: string;
  quoteValidityDays: number;
  warrantyDays: number;
  currency: string;
  timezone: string;
  osCodePrefix: string;
  quoteCodePrefix: string;
  saleCodePrefix: string;
}

export interface CustomStatus {
  id: string;
  entityType: 'service_order' | 'sale' | 'quote';
  name: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isFinal: boolean;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  role: string;
  module: string;
  actions: string[];
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/settings`;

  getSettings() {
    return this.http.get<TenantSettings>(this.base);
  }

  updateSettings(payload: Partial<TenantSettings>) {
    return this.http.patch<TenantSettings>(this.base, payload);
  }

  // Statuses
  getStatuses(entityType?: string) {
    const params: Record<string, string> = {};
    if (entityType) params['entityType'] = entityType;
    return this.http.get<CustomStatus[]>(`${this.base}/statuses`, { params });
  }

  createStatus(payload: Omit<CustomStatus, 'id' | 'isSystem'>) {
    return this.http.post<CustomStatus>(`${this.base}/statuses`, payload);
  }

  updateStatus(id: string, payload: Partial<CustomStatus>) {
    return this.http.patch<CustomStatus>(`${this.base}/statuses/${id}`, payload);
  }

  deleteStatus(id: string) {
    return this.http.delete<void>(`${this.base}/statuses/${id}`);
  }

  reorderStatuses(items: { id: string; sortOrder: number }[]) {
    return this.http.patch(`${this.base}/statuses/reorder`, items);
  }

  // Permissions
  getPermissions() {
    return this.http.get<Permission[]>(`${this.base}/permissions`);
  }

  updatePermissions(permissions: Omit<Permission, 'id'>[]) {
    return this.http.put(`${this.base}/permissions`, permissions);
  }
}
