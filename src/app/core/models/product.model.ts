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

export interface ProductRequest {
  nombre: string;
  categoriaId: number | null;
  precioCompra: number | null;
  precioVenta: number | null;
  stockActual: number;
  activo: boolean;
}
