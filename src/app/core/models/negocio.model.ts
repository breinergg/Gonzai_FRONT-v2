export type FormatoComprobante = 'termico' | 'media-carta';

export interface NegocioResponse {
  id: number;
  nombreComercial: string;
  telefono: string | null;
  ciudad: string | null;
  correoRespuesta: string | null;
  mensaje: string;
  formatoPredeterminado: FormatoComprobante | string;
  tieneLogo: boolean;
  tieneClaveIaPropia: boolean;
  claveIaFecha: string | null;
  tieneSmtpPropio: boolean;
  smtpUsuario: string | null;
  smtpFecha: string | null;
}

export interface NegocioUpdateRequest {
  nombreComercial: string;
  telefono: string | null;
  ciudad: string | null;
  correoRespuesta: string | null;
  mensaje: string | null;
  formatoPredeterminado: FormatoComprobante;
}

export interface CompartirComprobante {
  url: string;
  mensaje: string;
  whatsappUrl: string | null;
  expiraEn: string;
  formato: string;
}

export interface EnviarComprobanteResponse {
  message: string;
}
