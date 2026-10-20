import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

/** Mismo texto que devuelve el API cuando el rango de fechas está invertido. */
export const DATE_RANGE_ERROR = "La fecha 'desde' no puede ser mayor que 'hasta'.";

export function invalidDateRange(desde: string, hasta: string): boolean {
  return !!desde && !!hasta && desde > hasta;
}

export function filenameFromDisposition(header: string | null, fallback = 'reporte.xlsx'): string {
  if (!header) return fallback;

  const encoded = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^["']|["']$/g, ''));
    } catch {
      /* sigue con el nombre simple */
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(header);
  const name = plain?.[1]?.trim();
  return name || fallback;
}

export function saveReport(response: HttpResponse<Blob>, fallback = 'reporte.xlsx'): void {
  const blob = response.body;
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameFromDisposition(response.headers.get('Content-Disposition'), fallback);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** 422 y 404 llegan como blob porque la petición no es JSON. */
export async function reportErrorMessage(err: unknown, fallback = 'No se pudo descargar el archivo.'): Promise<string> {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';

  let raw: unknown = err.error;
  if (raw instanceof Blob) {
    try {
      raw = await raw.text();
    } catch {
      return fallback;
    }
  }

  if (typeof raw === 'string' && raw.trim()) {
    const text = raw.trim();
    try {
      raw = JSON.parse(text);
    } catch {
      return text;
    }
  }

  if (raw && typeof raw === 'object' && 'message' in raw) {
    const message = (raw as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }

  if (err.status === 404) return 'No se encontró el recurso solicitado.';
  return fallback;
}
