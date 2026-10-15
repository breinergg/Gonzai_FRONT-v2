import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PurchaseCreateRequest, PurchaseFilters, PurchaseResponse } from '../models/purchase.model';
import { AnulacionRequest } from '../models/common.model';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';
import { ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly apiUrl = `${environment.apiUrl}/compraproveedor`;

  constructor(private http: HttpClient, private products: ProductService) {}

  getAll(filters: PurchaseFilters = {}): Observable<PurchaseResponse[]> {
    return this.http.get<PurchaseResponse[]>(this.apiUrl, {
      params: toParams({ proveedorId: filters.proveedorId, desde: filters.desde, hasta: filters.hasta }),
    });
  }

  getById(id: number): Observable<PurchaseResponse> {
    return this.http.get<PurchaseResponse>(`${this.apiUrl}/${id}`);
  }

  create(dto: PurchaseCreateRequest): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(this.apiUrl, dto).pipe(tap(() => this.products.invalidateCatalog()));
  }

  annul(id: number, dto: AnulacionRequest): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(`${this.apiUrl}/${id}/anular`, dto)
      .pipe(tap(() => this.products.invalidateCatalog()));
  }
}
