import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { InventoryAdjustmentRequest, InventoryMovementResponse } from '../models/inventory.model';
import { environment } from '../../../environments/environment';
import { ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly apiUrl = `${environment.apiUrl}/movimientoinventario`;

  constructor(private http: HttpClient, private products: ProductService) {}

  getAll(): Observable<InventoryMovementResponse[]> {
    return this.http.get<InventoryMovementResponse[]>(this.apiUrl);
  }

  getByProduct(productoId: number): Observable<InventoryMovementResponse[]> {
    return this.http.get<InventoryMovementResponse[]>(`${this.apiUrl}/producto/${productoId}`);
  }

  /** Ajuste manual. La respuesta es un arreglo de movimientos. */
  createAdjustment(dto: InventoryAdjustmentRequest): Observable<InventoryMovementResponse[]> {
    return this.http.post<InventoryMovementResponse[]>(`${this.apiUrl}/ajuste`, dto)
      .pipe(tap(() => this.products.invalidateCatalog()));
  }
}
