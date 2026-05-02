import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ItemCategory, ItemBrand, ItemQuality, LookupItemType } from '@nexus-platform/shared-types';

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

  // Catalog: Categories
  getCategories(itemType?: LookupItemType) {
    const params: Record<string, string> = {};
    if (itemType) params['itemType'] = itemType;
    return this.http.get<ItemCategory[]>(`${this.base}/item-categories`, { params });
  }

  createCategory(payload: { name: string; itemType: LookupItemType; description?: string }) {
    return this.http.post<ItemCategory>(`${this.base}/item-categories`, payload);
  }

  updateCategory(id: string, payload: { name?: string; description?: string }) {
    return this.http.patch<ItemCategory>(`${this.base}/item-categories/${id}`, payload);
  }

  deleteCategory(id: string) {
    return this.http.delete<void>(`${this.base}/item-categories/${id}`);
  }

  // Catalog: Brands
  getBrands(itemType?: 'product' | 'part') {
    const params: Record<string, string> = {};
    if (itemType) params['itemType'] = itemType;
    return this.http.get<ItemBrand[]>(`${this.base}/item-brands`, { params });
  }

  createBrand(payload: { name: string; itemType: 'product' | 'part' }) {
    return this.http.post<ItemBrand>(`${this.base}/item-brands`, payload);
  }

  updateBrand(id: string, payload: { name?: string }) {
    return this.http.patch<ItemBrand>(`${this.base}/item-brands/${id}`, payload);
  }

  deleteBrand(id: string) {
    return this.http.delete<void>(`${this.base}/item-brands/${id}`);
  }

  // Catalog: Qualities
  getQualities(itemType?: 'product' | 'part') {
    const params: Record<string, string> = {};
    if (itemType) params['itemType'] = itemType;
    return this.http.get<ItemQuality[]>(`${this.base}/item-qualities`, { params });
  }

  createQuality(payload: { name: string; itemType: 'product' | 'part'; level?: number }) {
    return this.http.post<ItemQuality>(`${this.base}/item-qualities`, payload);
  }

  updateQuality(id: string, payload: { name?: string; level?: number }) {
    return this.http.patch<ItemQuality>(`${this.base}/item-qualities/${id}`, payload);
  }

  deleteQuality(id: string) {
    return this.http.delete<void>(`${this.base}/item-qualities/${id}`);
  }
}
