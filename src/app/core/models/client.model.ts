export interface ClientResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface ClientRequest {
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface ClienteMayorDeuda {
  id: number;
  nombre: string;
  telefono: string | null;
  totalDeuda: number;
}

export interface ClientesConDeudaCount {
  clientesConDeuda: number;
}

export interface ClientesActivosCount {
  clientesActivos: number;
}
