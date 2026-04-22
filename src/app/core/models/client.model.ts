export interface ClientResponse {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface ClientRequest {
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

// DTO para creación — coincide con ClienteCreateDto del backend
export interface ClientCreateRequest {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
}

// DTO para actualización — coincide con ClienteUpdateDto del backend
export interface ClientUpdateRequest {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

// DTO para crear movimiento de cliente — coincide con MovimientoClienteCreateDto
export interface ClientMovementCreateRequest {
  clienteId: number;
  tipoMovimiento: string;
  valor: number;
  descripcion: string | null;
}

export interface MovimientoClienteResponse {
  id: number;
  clienteId: number;
  clienteNombre: string;
  tipoMovimiento: string;
  valor: number;
  fecha: string;
  descripcion: string | null;
}

export interface ClienteMayorDeuda {
  id: number;
  nombre: string;
  telefono: string | null;
  totalDeuda: number;
}

export interface ClienteSaldoDto {
  clienteId: number;
  nombre: string;
  totalDeuda: number;
  totalAbonos: number;
  saldo: number;
  enPazYSalvo: boolean;
}

export interface ClientesConDeudaCount {
  clientesConDeuda: number;
}

export interface ClientesActivosCount {
  clientesActivos: number;
}
