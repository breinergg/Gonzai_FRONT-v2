import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryMovementRequest, InventoryMovementResponse } from '../models/inventory.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly apiUrl = `${environment.apiUrl}/movimientoinventario`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<InventoryMovementResponse[]> {
    return this.http.get<InventoryMovementResponse[]>(this.apiUrl);
  }

  getById(id: number): Observable<InventoryMovementResponse> {
    return this.http.get<InventoryMovementResponse>(`${this.apiUrl}/${id}`);
  }

  create(movement: InventoryMovementRequest): Observable<InventoryMovementResponse> {
    return this.http.post<InventoryMovementResponse>(this.apiUrl, movement);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
