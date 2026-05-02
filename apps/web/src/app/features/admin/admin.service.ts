import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AdminMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  recentSignups: number;
  payingTenants: number;
  mrr: number;
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

export interface AdminPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  modules: string[];
  limits: { max_os: number | null; max_users: number | null };
  is_active: boolean;
  sort_order: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  valid_until: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getMetrics() {
    return this.http.get<AdminMetrics>(`${this.base}/metrics`);
  }

  findAllTenants(search?: string, plan?: string, status?: string) {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (plan)   params['plan']   = plan;
    if (status) params['status'] = status;
    return this.http.get<AdminTenant[]>(`${this.base}/tenants`, { params });
  }

  findOneTenant(id: string) {
    return this.http.get<AdminTenant>(`${this.base}/tenants/${id}`);
  }

  updateTenant(id: string, payload: { plan?: string; isActive?: boolean; trialEndsAt?: string }) {
    return this.http.patch<AdminTenant>(`${this.base}/tenants/${id}`, payload);
  }

  deleteTenant(id: string) {
    return this.http.delete<void>(`${this.base}/tenants/${id}`);
  }

  extendTrial(id: string, days: number) {
    return this.http.post<AdminTenant>(`${this.base}/tenants/${id}/extend-trial`, { days });
  }

  revokeSubscription(id: string) {
    return this.http.post<AdminTenant>(`${this.base}/tenants/${id}/revoke-subscription`, {});
  }

  // Plans
  getPlans() {
    return this.http.get<AdminPlan[]>(`${this.base}/plans`);
  }

  createPlan(dto: Omit<AdminPlan, 'id'>) {
    return this.http.post<AdminPlan>(`${this.base}/plans`, dto);
  }

  updatePlan(id: string, dto: Partial<Omit<AdminPlan, 'id'>>) {
    return this.http.put<AdminPlan>(`${this.base}/plans/${id}`, dto);
  }

  deletePlan(id: string) {
    return this.http.delete<void>(`${this.base}/plans/${id}`);
  }

  // Coupons
  getCoupons() {
    return this.http.get<AdminCoupon[]>(`${this.base}/coupons`);
  }

  createCoupon(dto: Omit<AdminCoupon, 'id' | 'uses_count' | 'created_at'>) {
    return this.http.post<AdminCoupon>(`${this.base}/coupons`, dto);
  }

  updateCoupon(id: string, dto: Partial<Omit<AdminCoupon, 'id' | 'uses_count' | 'created_at'>>) {
    return this.http.patch<AdminCoupon>(`${this.base}/coupons/${id}`, dto);
  }

  deleteCoupon(id: string) {
    return this.http.delete<void>(`${this.base}/coupons/${id}`);
  }
}
