import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierCreateRequest, SupplierResponse, SupplierUpdateRequest } from '../models/supplier.model';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/proveedor`;

  constructor(private http: HttpClient) {}

  getAll(soloActivos = false): Observable<SupplierResponse[]> {
    return this.http.get<SupplierResponse[]>(this.apiUrl, { params: toParams({ soloActivos }) });
  }

  getById(id: number): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.apiUrl}/${id}`);
  }

  create(dto: SupplierCreateRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.apiUrl, dto);
  }

  update(id: number, dto: SupplierUpdateRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
