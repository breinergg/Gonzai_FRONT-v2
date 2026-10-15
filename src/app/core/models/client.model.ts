export interface ClientResponse {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface ClientCreateRequest {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
}

export interface ClientUpdateRequest {
  nombre: string;
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

export interface VentaPendiente {
  ventaClienteId: number;
  fecha: string;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  estadoPago: string;
}

export interface ClienteSaldo {
  clienteId: number;
  nombre: string;
  totalComprado: number;
  totalPagado: number;
  saldo: number;
  enPazYSalvo: boolean;
  ventasPendientes: VentaPendiente[];
}
