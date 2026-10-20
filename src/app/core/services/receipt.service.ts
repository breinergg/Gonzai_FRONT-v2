import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { toParams } from '../utils/http-params';
import { CompartirComprobante, EnviarComprobanteResponse, FormatoComprobante } from '../models/negocio.model';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  downloadSale(id: number, formato: FormatoComprobante): Observable<HttpResponse<Blob>> {
    return this.download('ventacliente', id, formato);
  }

  downloadPayment(id: number, formato: FormatoComprobante): Observable<HttpResponse<Blob>> {
    return this.download('pagocliente', id, formato);
  }

  shareSale(id: number, formato: FormatoComprobante, regenerar = false): Observable<CompartirComprobante> {
    return this.share('ventacliente', id, formato, regenerar);
  }

  sharePayment(id: number, formato: FormatoComprobante, regenerar = false): Observable<CompartirComprobante> {
    return this.share('pagocliente', id, formato, regenerar);
  }

  sendSale(id: number, correo: string, formato: FormatoComprobante): Observable<EnviarComprobanteResponse> {
    return this.send('ventacliente', id, correo, formato);
  }

  sendPayment(id: number, correo: string, formato: FormatoComprobante): Observable<EnviarComprobanteResponse> {
    return this.send('pagocliente', id, correo, formato);
  }

  private download(resource: string, id: number, formato: FormatoComprobante): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${resource}/${id}/comprobante`, {
      params: toParams({ formato }),
      responseType: 'blob',
      observe: 'response',
    });
  }

  private share(resource: string, id: number, formato: FormatoComprobante, regenerar: boolean): Observable<CompartirComprobante> {
    return this.http.get<CompartirComprobante>(`${this.apiUrl}/${resource}/${id}/comprobante/compartir`, {
      params: toParams({ formato, regenerar }),
    });
  }

  private send(resource: string, id: number, correo: string, formato: FormatoComprobante): Observable<EnviarComprobanteResponse> {
    return this.http.post<EnviarComprobanteResponse>(`${this.apiUrl}/${resource}/${id}/comprobante/enviar`, {
      correo,
      formato,
    });
  }
}
