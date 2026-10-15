export interface SaleLineRequest {
  productoVarianteId: number;
  cantidad: number;
  precioVentaUnitario: number;
  /** Opcional: lote del que sale la prenda. Si no se envía, el backend usa FIFO. */
  compraProveedorId?: number | null;
}

export interface SaleCreateRequest {
  clienteId: number;
  fecha: string | null;
  descripcion: string | null;
  montoPagado: number;
  metodoPago: string | null;
  detalles: SaleLineRequest[];
}

export interface SaleConsumption {
  existenciaId: number;
  compraProveedorId: number | null;
  loteCodigo: string | null;
  cantidad: number;
  costoUnitario: number;
}

export interface SaleLineResponse {
  id: number;
  productoVarianteId: number;
  productoId: number;
  productoNombre: string;
  varianteNombre: string;
  talla: string | null;
  color: string | null;
  compraProveedorSolicitadaId: number | null;
  loteSolicitadoCodigo: string | null;
  cantidad: number;
  precioVentaUnitario: number;
  subtotal: number;
  costoTotal: number;
  ganancia: number;
  consumos: SaleConsumption[];
}

export interface SalePaymentSummary {
  id: number;
  monto: number;
  metodoPago: string;
  fecha: string;
  estado: string;
}

export interface SaleResponse {
  id: number;
  clienteId: number;
  clienteNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fecha: string;
  descripcion: string | null;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  estadoPago: 'Pagada' | 'Parcial' | 'Pendiente' | string;
  estado: 'Activa' | 'Anulada' | string;
  motivoAnulacion: string | null;
  fechaAnulacion: string | null;
  costoTotal: number;
  ganancia: number;
  detalles: SaleLineResponse[];
  pagos: SalePaymentSummary[];
}

export interface SaleFilters {
  clienteId?: number | null;
  desde?: string | null;
  hasta?: string | null;
  soloPendientes?: boolean;
}

export interface VentaMensualResumen {
  mes: string;
  mesAnterior: string;
  totalMesActual: number;
  totalMesAnterior: number;
  porcentajeCambio: number;
  esAumento: boolean;
}

export function estadoPagoClass(estadoPago: string): string {
  switch (estadoPago) {
    case 'Pagada':    return 'pay-pagada';
    case 'Parcial':   return 'pay-parcial';
    case 'Pendiente': return 'pay-pendiente';
    default:          return 'status-inactive';
  }
}
