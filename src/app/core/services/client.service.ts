import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClienteMayorDeuda,
  ClienteSaldo,
  ClientCreateRequest,
  ClientResponse,
  ClientUpdateRequest,
} from '../models/client.model';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiUrl = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) {}

  getAll(soloActivos = false): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.apiUrl, { params: toParams({ soloActivos }) });
  }

  getById(id: number): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.apiUrl}/${id}`);
  }

  create(client: ClientCreateRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.apiUrl, client);
  }

  update(id: number, client: ClientUpdateRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${this.apiUrl}/${id}`, client);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  getSaldo(id: number): Observable<ClienteSaldo> {
    return this.http.get<ClienteSaldo>(`${this.apiUrl}/${id}/saldo`);
  }

  getMayorDeuda(): Observable<ClienteMayorDeuda> {
    return this.http.get<ClienteMayorDeuda>(`${this.apiUrl}/mayor-deuda`);
  }

  getTotalDeuda(): Observable<{ totalDeuda: number }> {
    return this.http.get<{ totalDeuda: number }>(`${this.apiUrl}/total-deuda`);
  }

  getCountConDeuda(): Observable<{ clientesConDeuda: number }> {
    return this.http.get<{ clientesConDeuda: number }>(`${this.apiUrl}/count-con-deuda`);
  }

  getCountActivos(): Observable<{ clientesActivos: number }> {
    return this.http.get<{ clientesActivos: number }>(`${this.apiUrl}/count`);
  }
}
