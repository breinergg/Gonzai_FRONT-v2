export interface InventoryMovementResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  tipoMovimiento: string;
  cantidad: number;
  fecha: string;
  descripcion: string | null;
}

export interface InventoryMovementRequest {
  productoId: number;
  tipoMovimiento: string;
  cantidad: number;
  descripcion: string | null;
}

export const MOVEMENT_TYPES = ['ENTRADA', 'SALIDA'] as const;
export type MovementType = typeof MOVEMENT_TYPES[number];
