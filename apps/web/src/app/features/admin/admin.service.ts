import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AdminMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  recentSignups: number;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  segment: string;
  cnpj: string | null;
  phone: string | null;
  user_count?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getMetrics() {
    return this.http.get<AdminMetrics>(`${this.base}/metrics`);
  }

  findAllTenants(search?: string) {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<AdminTenant[]>(`${this.base}/tenants`, { params });
  }

  findOneTenant(id: string) {
    return this.http.get<AdminTenant>(`${this.base}/tenants/${id}`);
  }

  updateTenant(id: string, payload: { plan?: string; isActive?: boolean; trialEndsAt?: string }) {
    return this.http.patch<AdminTenant>(`${this.base}/tenants/${id}`, payload);
  }
}
