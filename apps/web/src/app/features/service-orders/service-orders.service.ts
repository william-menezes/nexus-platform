import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServiceOrder } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/service-orders`;

  getAll() {
    return this.http.get<ServiceOrder[]>(this.base);
  }

  getOne(id: string) {
    return this.http.get<ServiceOrder>(`${this.base}/${id}`);
  }

  create(dto: Partial<ServiceOrder>) {
    return this.http.post<ServiceOrder>(this.base, dto);
  }

  update(id: string, dto: Partial<ServiceOrder>) {
    return this.http.patch<ServiceOrder>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
