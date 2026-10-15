export interface PurchaseLineRequest {
  productoVarianteId: number;
  cantidad: number;
  costoUnitario: number;
}

export interface PurchaseCreateRequest {
  proveedorId: number;
  nombre: string | null;
  fecha: string | null;
  numeroFactura: string | null;
  descripcion: string | null;
  costoEnvio: number;
  detalles: PurchaseLineRequest[];
}

export interface PurchaseLineResponse {
  id: number;
  productoVarianteId: number;
  productoId: number;
  productoNombre: string;
  varianteNombre: string;
  talla: string | null;
  color: string | null;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  existenciaId: number | null;
  cantidadDisponible: number | null;
}

export interface PurchaseResponse {
  id: number;
  codigo: string | null;
  nombre: string | null;
  proveedorId: number;
  proveedorNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fecha: string;
  numeroFactura: string | null;
  descripcion: string | null;
  totalUnidades: number;
  subtotalProductos: number;
  costoEnvio: number;
  total: number;
  estado: string;
  motivoAnulacion: string | null;
  fechaAnulacion: string | null;
  detalles: PurchaseLineResponse[];
}

export interface PurchaseFilters {
  proveedorId?: number | null;
  desde?: string | null;
  hasta?: string | null;
}
