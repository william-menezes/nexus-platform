import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquipmentsService {
  private http = inject(HttpClient);
  private typesBase = `${environment.apiUrl}/equipment-types`;
  private base = `${environment.apiUrl}/equipments`;

  getAllTypes() {
    return this.http.get<EquipmentType[]>(this.typesBase);
  }

  createType(dto: Partial<EquipmentType>) {
    return this.http.post<EquipmentType>(this.typesBase, dto);
  }

  updateType(id: string, dto: Partial<EquipmentType>) {
    return this.http.patch<EquipmentType>(`${this.typesBase}/${id}`, dto);
  }

  removeType(id: string) {
    return this.http.delete(`${this.typesBase}/${id}`);
  }

  getAll(clientId?: string, typeId?: string) {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (typeId) params = params.set('typeId', typeId);
    return this.http.get<Equipment[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Equipment>(`${this.base}/${id}`);
  }

  create(dto: Partial<Equipment>) {
    return this.http.post<Equipment>(this.base, dto);
  }

  update(id: string, dto: Partial<Equipment>) {
    return this.http.patch<Equipment>(`${this.base}/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
