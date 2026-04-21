export interface ProductResponse {
  id: number;
  nombre: string;
  categoriaId: number | null;
  precioCompra: number | null;
  precioVenta: number | null;
  stockActual: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  categoria: { id: number; nombre: string } | null;
}

// DTO para actualización — coincide con ProductoUpdateDto del backend (sin StockActual)
export interface ProductUpdateRequest {
  nombre: string;
  categoriaId: number | null;
  precioCompra: number | null;
  precioVenta: number | null;
  activo: boolean;
}

// DTO para creación — coincide con ProductoCreateDto del backend (sin campo activo)
export interface ProductCreateRequest {
  nombre: string;
  categoriaId: number | null;
  precioCompra: number | null;
  precioVenta: number | null;
  stockActual: number;
}
