import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LotDetail, LotSummary, StockAvailability } from '../models/lot.model';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class LotService {
  private readonly apiUrl = `${environment.apiUrl}/lote`;

  constructor(private http: HttpClient) {}

  getAll(proveedorId?: number | null, soloConStock = false): Observable<LotSummary[]> {
    return this.http.get<LotSummary[]>(this.apiUrl, { params: toParams({ proveedorId, soloConStock }) });
  }

  getById(id: number): Observable<LotDetail> {
    return this.http.get<LotDetail>(`${this.apiUrl}/${id}`);
  }

  getByCode(codigo: string): Observable<LotDetail> {
    return this.http.get<LotDetail>(`${this.apiUrl}/codigo/${encodeURIComponent(codigo)}`);
  }

  /** Stock disponible por lote en orden FIFO (la primera fila es la que se vende por defecto). */
  getAvailableByVariant(productoVarianteId: number): Observable<StockAvailability[]> {
    return this.http.get<StockAvailability[]>(`${this.apiUrl}/disponibles`, { params: toParams({ productoVarianteId }) });
  }

  getAvailableByProduct(productoId: number): Observable<StockAvailability[]> {
    return this.http.get<StockAvailability[]>(`${this.apiUrl}/disponibles`, { params: toParams({ productoId }) });
  }
}
