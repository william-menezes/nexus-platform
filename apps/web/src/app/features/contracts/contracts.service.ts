import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Contract,
  ContractBilling,
  CreateContractPayload,
  UpdateContractPayload,
} from '@nexus-platform/shared-types';

@Injectable({ providedIn: 'root' })
export class ContractsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/contracts`;

  findAll(status?: string) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<Contract[]>(this.base, { params });
  }

  findOne(id: string) {
    return this.http.get<Contract>(`${this.base}/${id}`);
  }

  findBilling(id: string) {
    return this.http.get<ContractBilling[]>(`${this.base}/${id}/billing`);
  }

  create(payload: CreateContractPayload) {
    return this.http.post<Contract>(this.base, payload);
  }

  update(id: string, payload: UpdateContractPayload) {
    return this.http.patch<Contract>(`${this.base}/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  activate(id: string) {
    return this.http.post<Contract>(`${this.base}/${id}/activate`, {});
  }

  suspend(id: string) {
    return this.http.post<Contract>(`${this.base}/${id}/suspend`, {});
  }

  cancel(id: string) {
    return this.http.post<Contract>(`${this.base}/${id}/cancel`, {});
  }

  generateBilling(id: string) {
    return this.http.post<ContractBilling>(`${this.base}/${id}/bill`, {});
  }
}
