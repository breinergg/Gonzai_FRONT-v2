import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';

export interface LibroVentasFilters {
  desde?: string | null;
  hasta?: string | null;
  clienteId?: number | null;
  soloPendientes?: boolean;
  incluirAnuladas?: boolean;
}

export interface AbonosFilters {
  desde?: string | null;
  hasta?: string | null;
  clienteId?: number | null;
  incluirAnulados?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  libroVentas(filters: LibroVentasFilters = {}): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/libro-ventas`, {
      params: toParams({
        desde: filters.desde,
        hasta: filters.hasta,
        clienteId: filters.clienteId,
        soloPendientes: filters.soloPendientes,
        incluirAnuladas: filters.incluirAnuladas,
      }),
      responseType: 'blob',
      observe: 'response',
    });
  }

  cartera(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/cartera`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  estadoCuenta(clienteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/estado-cuenta/${clienteId}`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  abonos(filters: AbonosFilters = {}): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/abonos`, {
      params: toParams({
        desde: filters.desde,
        hasta: filters.hasta,
        clienteId: filters.clienteId,
        incluirAnulados: filters.incluirAnulados,
      }),
      responseType: 'blob',
      observe: 'response',
    });
  }
}
