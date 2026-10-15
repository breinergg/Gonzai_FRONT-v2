import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
  ProductVariant,
  VariantCreateRequest,
  VariantMatrixRequest,
  VariantUpdateRequest,
} from '../models/product.model';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/producto`;

  /** Catálogo de productos activos (con variantes activas) que usa el selector de variante. */
  readonly catalog = signal<ProductResponse[]>([]);
  readonly catalogLoading = signal(false);
  private catalogLoaded = false;

  readonly catalogVariants = computed(() =>
    this.catalog().flatMap(p => p.variantes.filter(v => v.activo))
  );

  constructor(private http: HttpClient) {}

  getAll(soloActivos = false): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl, { params: toParams({ soloActivos }) });
  }

  getById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  create(product: ProductCreateRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, product).pipe(tap(() => this.invalidateCatalog()));
  }

  update(id: number, product: ProductUpdateRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, product).pipe(tap(() => this.invalidateCatalog()));
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }).pipe(tap(() => this.invalidateCatalog()));
  }

  getCountActivos(): Observable<{ productosActivos: number }> {
    return this.http.get<{ productosActivos: number }>(`${this.apiUrl}/count`);
  }

  /* ── Variantes ─── */

  getVariant(varianteId: number): Observable<ProductVariant> {
    return this.http.get<ProductVariant>(`${this.apiUrl}/variante/${varianteId}`);
  }

  createVariant(productoId: number, dto: VariantCreateRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.apiUrl}/${productoId}/variantes`, dto)
      .pipe(tap(() => this.invalidateCatalog()));
  }

  createMatrix(productoId: number, dto: VariantMatrixRequest): Observable<ProductVariant[]> {
    return this.http.post<ProductVariant[]>(`${this.apiUrl}/${productoId}/variantes/matriz`, dto)
      .pipe(tap(() => this.invalidateCatalog()));
  }

  updateVariant(varianteId: number, dto: VariantUpdateRequest): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.apiUrl}/variante/${varianteId}`, dto)
      .pipe(tap(() => this.invalidateCatalog()));
  }

  deleteVariant(varianteId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/variante/${varianteId}`, { responseType: 'text' })
      .pipe(tap(() => this.invalidateCatalog()));
  }

  /* ── Catálogo compartido ─── */

  loadCatalog(force = false): void {
    if (this.catalogLoading() || (this.catalogLoaded && !force)) return;
    this.catalogLoading.set(true);
    this.getAll(true).subscribe({
      next: (data) => {
        this.catalog.set(data);
        this.catalogLoaded = true;
        this.catalogLoading.set(false);
      },
      error: () => this.catalogLoading.set(false),
    });
  }

  /** Marca el catálogo como desactualizado y lo recarga si ya se había usado. */
  invalidateCatalog(): void {
    if (!this.catalogLoaded) return;
    this.catalogLoaded = false;
    this.loadCatalog(true);
  }
}
