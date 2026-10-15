export interface PaymentCreateRequest {
  ventaClienteId: number;
  clienteId: number;
  monto: number;
  metodoPago: string;
  fecha: string | null;
  descripcion: string | null;
}

export interface PaymentResponse {
  id: number;
  ventaClienteId: number;
  clienteId: number;
  clienteNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  monto: number;
  metodoPago: string;
  fecha: string;
  descripcion: string | null;
  estado: string;
  motivoAnulacion: string | null;
  fechaAnulacion: string | null;
  saldoPendienteVenta: number;
}
