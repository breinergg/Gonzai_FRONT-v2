import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteMayorDeuda, ClientesConDeudaCount, ClientCreateRequest, ClientUpdateRequest, ClientMovementCreateRequest, MovimientoClienteResponse, ClienteSaldoDto, ClientRequest, ClientResponse } from '../models/client.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiUrl = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.apiUrl);
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

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createMovement(movement: ClientMovementCreateRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/movimientocliente`, movement);
  }

  getAllMovements(): Observable<MovimientoClienteResponse[]> {
    return this.http.get<MovimientoClienteResponse[]>(`${environment.apiUrl}/movimientocliente`);
  }

  getSaldo(id: number): Observable<ClienteSaldoDto> {
    return this.http.get<ClienteSaldoDto>(`${this.apiUrl}/${id}/saldo`);
  }

  getMayorDeuda(): Observable<ClienteMayorDeuda> {
    return this.http.get<ClienteMayorDeuda>(`${this.apiUrl}/mayor-deuda`);
  }

  getCountConDeuda(): Observable<ClientesConDeudaCount> {
    return this.http.get<ClientesConDeudaCount>(`${this.apiUrl}/count-con-deuda`);
  }

  getCountActivos(): Observable<{ clientesActivos: number }> {
    return this.http.get<{ clientesActivos: number }>(`${this.apiUrl}/count`);
  }
}
