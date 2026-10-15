import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentCreateRequest, PaymentResponse } from '../models/payment.model';
import { AnulacionRequest } from '../models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/pagocliente`;

  constructor(private http: HttpClient) {}

  getByClient(clienteId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  getBySale(ventaId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/venta/${ventaId}`);
  }

  create(dto: PaymentCreateRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.apiUrl, dto);
  }

  annul(id: number, dto: AnulacionRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/${id}/anular`, dto);
  }
}
