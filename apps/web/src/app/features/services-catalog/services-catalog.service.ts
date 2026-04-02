import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ServiceCatalog } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServicesCatalogService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/services`;

  getAll(search?: string) {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<ServiceCatalog[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<ServiceCatalog>(`${this.base}/${id}`);
  }

  create(dto: Partial<ServiceCatalog>) {
    return this.http.post<ServiceCatalog>(this.base, dto);
  }

  update(id: string, dto: Partial<ServiceCatalog>) {
    return this.http.patch<ServiceCatalog>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
