export interface LotSummary {
  compraProveedorId: number;
  codigo: string | null;
  nombre: string | null;
  proveedorId: number;
  proveedorNombre: string;
  fecha: string;
  estado: string;
  unidadesCompradas: number;
  unidadesVendidas: number;
  unidadesDisponibles: number;
  unidadesAjustadas: number;
  subtotalProductos: number;
  costoEnvio: number;
  inversionTotal: number;
  /** Valor VENDIDO (no lo cobrado). */
  ingresos: number;
  costoVendido: number;
  gananciaBruta: number;
  gananciaNeta: number;
  valorInventarioDisponible: number;
  porcentajeVendido: number;
  porcentajeRecuperado: number;
  inversionRecuperada: boolean;
}

export interface LotLine {
  compraProveedorDetalleId: number;
  existenciaId: number | null;
  productoVarianteId: number;
  productoId: number;
  productoNombre: string;
  varianteNombre: string;
  talla: string | null;
  color: string | null;
  costoUnitario: number;
  comprado: number;
  vendido: number;
  disponible: number;
  ajustado: number;
  ingresos: number;
  costoVendido: number;
  gananciaBruta: number;
}

export interface LotDetail extends LotSummary {
  numeroFactura: string | null;
  descripcion: string | null;
  lineas: LotLine[];
}

/** Stock disponible de una variante agrupado por lote (orden FIFO). */
export interface StockAvailability {
  existenciaId: number;
  productoVarianteId: number;
  varianteNombre: string;
  compraProveedorId: number | null;
  loteCodigo: string | null;
  loteNombre: string | null;
  proveedorNombre: string | null;
  origen: string;
  fechaIngreso: string;
  cantidadDisponible: number;
  costoUnitario: number;
}

export const INGRESOS_TOOLTIP = 'Ingresos = valor VENDIDO del lote (precio × unidades), incluye lo que los clientes aún deben. No es lo cobrado.';
