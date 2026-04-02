import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ChartOfAccount, CostCenter, FinancialEntry, CashRegister, CashSession, CashMovement,
} from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/financial`;

  // Chart of Accounts
  getAccounts() {
    return this.http.get<ChartOfAccount[]>(`${this.base}/chart-of-accounts`);
  }

  createAccount(dto: Partial<ChartOfAccount>) {
    return this.http.post<ChartOfAccount>(`${this.base}/chart-of-accounts`, dto);
  }

  deleteAccount(id: string) {
    return this.http.delete(`${this.base}/chart-of-accounts/${id}`);
  }

  // Cost Centers
  getCostCenters() {
    return this.http.get<CostCenter[]>(`${this.base}/cost-centers`);
  }

  createCostCenter(dto: Partial<CostCenter>) {
    return this.http.post<CostCenter>(`${this.base}/cost-centers`, dto);
  }

  // Financial Entries
  getEntries(type?: string, status?: string, from?: string, to?: string) {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<FinancialEntry[]>(`${this.base}/entries`, { params });
  }

  getEntry(id: string) {
    return this.http.get<FinancialEntry>(`${this.base}/entries/${id}`);
  }

  createEntry(dto: Partial<FinancialEntry> & { installmentCount?: number }) {
    return this.http.post<FinancialEntry>(`${this.base}/entries`, dto);
  }

  deleteEntry(id: string) {
    return this.http.delete(`${this.base}/entries/${id}`);
  }

  payInstallment(id: string, dto: { paidAmount: number; paymentMethod?: string; notes?: string }) {
    return this.http.patch(`${this.base}/installments/${id}/pay`, dto);
  }

  // Cash Registers
  getRegisters() {
    return this.http.get<CashRegister[]>(`${this.base}/cash-registers`);
  }

  // Cash Sessions
  getCurrentSession() {
    return this.http.get<CashSession | null>(`${this.base}/cash-sessions/current`);
  }

  openSession(dto: { cashRegisterId: string; openingAmount: number }) {
    return this.http.post<CashSession>(`${this.base}/cash-sessions/open`, dto);
  }

  closeSession(dto: { closingAmount: number; notes?: string }) {
    return this.http.post<CashSession>(`${this.base}/cash-sessions/close`, dto);
  }

  getSession(id: string) {
    return this.http.get<CashSession & { movements: CashMovement[] }>(`${this.base}/cash-sessions/${id}`);
  }

  createMovement(dto: { type: string; amount: number; description: string }) {
    return this.http.post<CashMovement>(`${this.base}/cash-movements`, dto);
  }
}
