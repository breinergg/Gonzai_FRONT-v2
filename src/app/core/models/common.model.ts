export interface AnulacionRequest {
  motivo: string;
}

export const ESTADO_ACTIVA = 'Activa';
export const ESTADO_ANULADA = 'Anulada';
export const ESTADO_PAGO_ACTIVO = 'Activo';
export const ESTADO_PAGO_ANULADO = 'Anulado';

export const METODOS_PAGO = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta',       label: 'Tarjeta' },
  { value: 'nequi',         label: 'Nequi' },
  { value: 'daviplata',     label: 'Daviplata' },
  { value: 'otro',          label: 'Otro' },
] as const;

export type MetodoPago = typeof METODOS_PAGO[number]['value'];

export function metodoPagoLabel(value: string | null | undefined): string {
  return METODOS_PAGO.find(m => m.value === value)?.label ?? (value || '—');
}

export function isAnulado(estado: string | null | undefined): boolean {
  return estado === ESTADO_ANULADA || estado === ESTADO_PAGO_ANULADO;
}
