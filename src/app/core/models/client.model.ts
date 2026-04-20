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
