export interface DailySaleResponse {
  id: number;
  fecha: string;          // DateOnly → 'YYYY-MM-DD'
  total: number;
  descripcion: string | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  fechaCreacion: string;
}

export interface DailySaleRequest {
  fecha: string;          // 'YYYY-MM-DD'
  total: number;
  descripcion: string | null;
  usuarioId: number | null;
}

export interface VentaMensualResumen {
  mes: string;
  mesAnterior: string;
  totalMesActual: number;
  totalMesAnterior: number;
  porcentajeCambio: number;
  esAumento: boolean;
}
