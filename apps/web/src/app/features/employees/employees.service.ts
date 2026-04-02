import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Employee } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/employees`;

  getAll(search?: string, activeOnly?: boolean) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (activeOnly) params = params.set('activeOnly', 'true');
    return this.http.get<Employee[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Employee>(`${this.base}/${id}`);
  }

  create(dto: Partial<Employee>) {
    return this.http.post<Employee>(this.base, dto);
  }

  update(id: string, dto: Partial<Employee>) {
    return this.http.patch<Employee>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
