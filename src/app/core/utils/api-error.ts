import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  status: number;
  /** Mensaje general listo para mostrar. */
  message: string;
  /** Errores por campo (400 ProblemDetails). Clave en minúscula, p. ej. "nombre" o "detalles[0].cantidad". */
  fieldErrors: Record<string, string>;
}

/**
 * Normaliza las respuestas de error del API:
 * - 400 ProblemDetails → errores por campo
 * - 404 / 409 / 422 { message } → se muestra tal cual
 * - 403 → acción exclusiva de administradores
 */
export function parseApiError(err: unknown, fallback = 'Ocurrió un error inesperado.'): ApiError {
  if (!(err instanceof HttpErrorResponse)) {
    return { status: -1, message: fallback, fieldErrors: {} };
  }

  const body = parseBody(err.error);
  const serverMessage: string | null =
    typeof body === 'string' && body.trim() ? body : (body?.message ?? null);

  switch (err.status) {
    case 0:
      return { status: 0, message: 'No se pudo conectar con el servidor.', fieldErrors: {} };
    case 400: {
      const fieldErrors: Record<string, string> = {};
      if (body?.errors && typeof body.errors === 'object') {
        for (const [key, value] of Object.entries(body.errors as Record<string, string[] | string>)) {
          const msg = Array.isArray(value) ? value[0] : value;
          if (msg) fieldErrors[normalizeKey(key)] = msg;
        }
      }
      const messages = Object.values(fieldErrors);
      return {
        status: 400,
        message: serverMessage ?? (messages.length ? messages.join(' ') : body?.title ?? 'Revisa los datos ingresados.'),
        fieldErrors,
      };
    }
    case 401:
      return { status: 401, message: 'Tu sesión expiró. Vuelve a iniciar sesión.', fieldErrors: {} };
    case 403:
      return { status: 403, message: 'Solo administradores pueden realizar esta acción.', fieldErrors: {} };
    case 404:
      return { status: 404, message: serverMessage ?? 'No se encontró el recurso solicitado.', fieldErrors: {} };
    default:
      return { status: err.status, message: serverMessage ?? fallback, fieldErrors: {} };
  }
}

/** Atajo para obtener solo el mensaje. */
export function apiErrorMessage(err: unknown, fallback?: string): string {
  return parseApiError(err, fallback).message;
}

function parseBody(raw: unknown): any {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function normalizeKey(key: string): string {
  return key.replace(/^\$\./, '').replace(/^dto\./i, '').toLowerCase();
}
