import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SaleCreateRequest, SaleFilters, SaleResponse, VentaMensualResumen } from '../models/sale.model';
import { AnulacionRequest } from '../models/common.model';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';
import { ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiUrl = `${environment.apiUrl}/ventacliente`;

  constructor(private http: HttpClient, private products: ProductService) {}

  getAll(filters: SaleFilters = {}): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(this.apiUrl, {
      params: toParams({
        clienteId: filters.clienteId,
        desde: filters.desde,
        hasta: filters.hasta,
        soloPendientes: filters.soloPendientes,
      }),
    });
  }

  getById(id: number): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.apiUrl}/${id}`);
  }

  getResumenMensual(): Observable<VentaMensualResumen> {
    return this.http.get<VentaMensualResumen>(`${this.apiUrl}/resumen-mensual`);
  }

  create(dto: SaleCreateRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(this.apiUrl, dto).pipe(tap(() => this.products.invalidateCatalog()));
  }

  annul(id: number, dto: AnulacionRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.apiUrl}/${id}/anular`, dto)
      .pipe(tap(() => this.products.invalidateCatalog()));
  }
}
