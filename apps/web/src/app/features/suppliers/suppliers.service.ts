import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Supplier, CreateSupplierPayload, UpdateSupplierPayload } from '@nexus-platform/shared-types';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/suppliers`;

  findAll(search?: string) {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<Supplier[]>(this.base, { params });
  }

  findOne(id: string) {
    return this.http.get<Supplier>(`${this.base}/${id}`);
  }

  create(payload: CreateSupplierPayload) {
    return this.http.post<Supplier>(this.base, payload);
  }

  update(id: string, payload: UpdateSupplierPayload) {
    return this.http.patch<Supplier>(`${this.base}/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
