/** Zona horaria del negocio (Colombia no tiene horario de verano). */
export const BUSINESS_TZ = 'America/Bogota';

const copFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, minimumFractionDigits: 0 });

/** $1.250.000 — pesos colombianos sin decimales. */
export function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${copFormatter.format(Math.abs(Math.round(value)))}`;
}

/** El API envía fechas UTC; si el texto no trae zona horaria se interpreta como UTC. */
export function parseUtc(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(hasZone || isDateOnly ? value : `${value}Z`);
  return isNaN(date.getTime()) ? null : date;
}

const formatters: Record<string, Intl.DateTimeFormat> = {
  date:     new Intl.DateTimeFormat('es-CO', { timeZone: BUSINESS_TZ, day: '2-digit', month: 'short', year: 'numeric' }),
  time:     new Intl.DateTimeFormat('es-CO', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit', hour12: true }),
  datetime: new Intl.DateTimeFormat('es-CO', {
    timeZone: BUSINESS_TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  }),
  short:    new Intl.DateTimeFormat('es-CO', { timeZone: BUSINESS_TZ, day: '2-digit', month: 'short' }),
  dmy:      new Intl.DateTimeFormat('es-CO', { timeZone: BUSINESS_TZ, day: '2-digit', month: '2-digit', year: 'numeric' }),
};

export type DateFormat = 'date' | 'time' | 'datetime' | 'short' | 'dmy';

/** Formatea una fecha UTC del API en hora de Colombia. */
export function formatColombia(value: string | Date | null | undefined, format: DateFormat = 'date'): string {
  const date = parseUtc(value);
  if (!date) return '—';
  return formatters[format].format(date).replace(/\./g, '');
}

/** Fecha de hoy en Colombia como YYYY-MM-DD (para filtros y formularios). */
export function todayColombia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ }).format(new Date());
}

/** Día local (YYYY-MM-DD) en Colombia de una fecha UTC del API. */
export function dayColombia(value: string | Date | null | undefined): string {
  const date = parseUtc(value);
  return date ? new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ }).format(date) : '';
}

/**
 * Convierte la fecha elegida en un formulario (YYYY-MM-DD) al valor que espera el API.
 * Hoy → null (el servidor usa la hora actual). Otro día → mediodía hora local (el API lo pasa a UTC).
 */
export function toApiDate(day: string | null | undefined): string | null {
  if (!day || day === todayColombia()) return null;
  return `${day}T12:00:00`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
}
