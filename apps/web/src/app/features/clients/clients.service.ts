import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Client } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clients`;

  getAll(search?: string) {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Client[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(dto: Partial<Client>) {
    return this.http.post<Client>(this.base, dto);
  }

  update(id: string, dto: Partial<Client>) {
    return this.http.patch<Client>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
