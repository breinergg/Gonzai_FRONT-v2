export interface InventoryMovementResponse {
  id: number;
  productoVarianteId: number;
  productoId: number;
  productoNombre: string;
  varianteNombre: string;
  existenciaId: number;
  loteCodigo: string | null;
  tipoMovimiento: 'entrada' | 'salida' | string;
  motivo: string;
  cantidad: number;
  costoUnitario: number;
  stockResultante: number;
  compraProveedorId: number | null;
  ventaClienteId: number | null;
  usuarioId: number;
  usuarioNombre: string;
  fecha: string;
  descripcion: string | null;
}

export interface InventoryAdjustmentRequest {
  productoVarianteId: number;
  tipoMovimiento: 'entrada' | 'salida';
  cantidad: number;
  /** Solo para entradas. */
  costoUnitario: number | null;
  /** Solo para salidas; nunca junto con existenciaId. */
  compraProveedorId: number | null;
  /** Solo para salidas; nunca junto con compraProveedorId. */
  existenciaId: number | null;
  descripcion: string;
}

export const MOTIVOS_MOVIMIENTO: Record<string, string> = {
  CompraProveedor:   'Compra a proveedor',
  VentaCliente:      'Venta a cliente',
  AjusteManual:      'Ajuste manual',
  AnulacionCompra:   'Anulación de compra',
  AnulacionVenta:    'Anulación de venta',
  InventarioInicial: 'Inventario inicial',
};

export function motivoLabel(motivo: string): string {
  return MOTIVOS_MOVIMIENTO[motivo] ?? motivo;
}
