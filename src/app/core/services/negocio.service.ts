import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NegocioResponse, NegocioUpdateRequest } from '../models/negocio.model';

@Injectable({ providedIn: 'root' })
export class NegocioService {
  private readonly apiUrl = `${environment.apiUrl}/negocio`;
  private cache$: Observable<NegocioResponse> | null = null;

  constructor(private http: HttpClient) {}

  get(force = false): Observable<NegocioResponse> {
    if (!this.cache$ || force) {
      this.cache$ = this.http.get<NegocioResponse>(this.apiUrl).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  update(dto: NegocioUpdateRequest): Observable<NegocioResponse> {
    return this.http.put<NegocioResponse>(this.apiUrl, dto).pipe(tap(negocio => this.remember(negocio)));
  }

  getLogo(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/logo`, { responseType: 'blob' });
  }

  uploadLogo(archivo: File): Observable<NegocioResponse> {
    const data = new FormData();
    data.append('archivo', archivo);
    return this.http.put<NegocioResponse>(`${this.apiUrl}/logo`, data).pipe(tap(negocio => this.remember(negocio)));
  }

  deleteLogo(): Observable<NegocioResponse> {
    return this.http.delete<NegocioResponse>(`${this.apiUrl}/logo`).pipe(tap(negocio => this.remember(negocio)));
  }

  private remember(negocio: NegocioResponse): void {
    this.cache$ = of(negocio);
  }
}
