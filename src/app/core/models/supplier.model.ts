export interface SupplierResponse {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface SupplierCreateRequest {
  nombre: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
}

export interface SupplierUpdateRequest extends SupplierCreateRequest {
  activo: boolean;
}
