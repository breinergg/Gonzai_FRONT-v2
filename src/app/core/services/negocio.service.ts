import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NegocioResponse, NegocioUpdateRequest } from '../models/negocio.model';

@Injectable({ providedIn: 'root' })
export class NegocioService {
  private readonly apiUrl = `${environment.apiUrl}/negocio`;
  private cache$: Observable<NegocioResponse> | null = null;

  /** Último negocio cargado (o null). Lo usa el título de la pestaña del navegador. */
  readonly actual = signal<NegocioResponse | null>(null);

  constructor(private http: HttpClient) {}

  get(force = false): Observable<NegocioResponse> {
    if (!this.cache$ || force) {
      this.cache$ = this.http.get<NegocioResponse>(this.apiUrl).pipe(
        tap(negocio => this.actual.set(negocio)),
        shareReplay(1),
      );
    }
    return this.cache$;
  }

  /** Al cerrar sesión: evita arrastrar en la pestaña el nombre de la empresa anterior. */
  clear(): void {
    this.cache$ = null;
    this.actual.set(null);
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

  configurarClaveGemini(apiKey: string): Observable<NegocioResponse> {
    return this.http
      .put<NegocioResponse>(`${this.apiUrl}/ia/gemini`, { apiKey })
      .pipe(tap(negocio => this.remember(negocio)));
  }

  quitarClaveGemini(): Observable<NegocioResponse> {
    return this.http
      .delete<NegocioResponse>(`${this.apiUrl}/ia/gemini`)
      .pipe(tap(negocio => this.remember(negocio)));
  }

  configurarSmtp(dto: { usuario: string; password: string; host?: string; puerto?: number; seguridad?: string }): Observable<NegocioResponse> {
    return this.http
      .put<NegocioResponse>(`${this.apiUrl}/smtp`, dto)
      .pipe(tap(negocio => this.remember(negocio)));
  }

  quitarSmtp(): Observable<NegocioResponse> {
    return this.http
      .delete<NegocioResponse>(`${this.apiUrl}/smtp`)
      .pipe(tap(negocio => this.remember(negocio)));
  }

  probarSmtp(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/smtp/probar`, null);
  }

  private remember(negocio: NegocioResponse): void {
    this.cache$ = of(negocio);
    this.actual.set(negocio);
  }
}
