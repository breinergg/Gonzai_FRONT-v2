import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DailySaleRequest, DailySaleResponse } from '../models/daily-sale.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DailySaleService {
  private readonly apiUrl = `${environment.apiUrl}/ventadiaria`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DailySaleResponse[]> {
    return this.http.get<DailySaleResponse[]>(this.apiUrl);
  }

  getById(id: number): Observable<DailySaleResponse> {
    return this.http.get<DailySaleResponse>(`${this.apiUrl}/${id}`);
  }

  create(sale: DailySaleRequest): Observable<DailySaleResponse> {
    return this.http.post<DailySaleResponse>(this.apiUrl, sale);
  }

  update(id: number, sale: DailySaleRequest): Observable<DailySaleResponse> {
    return this.http.put<DailySaleResponse>(`${this.apiUrl}/${id}`, sale);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
