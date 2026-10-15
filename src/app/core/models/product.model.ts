export interface ProductVariant {
  id: number;
  productoId: number;
  productoNombre: string;
  nombreCompleto: string;
  talla: string | null;
  color: string | null;
  sku: string | null;
  /** Precio efectivo: el de la variante o, si no tiene, el del producto. */
  precioVenta: number | null;
  tienePrecioPropio: boolean;
  /** Último costo de compra (solo referencia). */
  precioCompra: number | null;
  stockActual: number;
  activo: boolean;
}

export interface ProductResponse {
  id: number;
  nombre: string;
  categoriaId: number | null;
  categoriaNombre: string | null;
  marca: string | null;
  precioVenta: number | null;
  stockTotal: number;
  activo: boolean;
  fechaCreacion: string;
  variantes: ProductVariant[];
}

export interface VariantCreateRequest {
  talla: string | null;
  color: string | null;
  sku?: string | null;
  precioVenta?: number | null;
  stockInicial?: number;
  costoInicial?: number | null;
}

export interface VariantUpdateRequest {
  talla: string | null;
  color: string | null;
  sku: string | null;
  precioVenta: number | null;
  activo: boolean;
}

export interface VariantMatrixRequest {
  tallas: string[];
  colores: string[];
  precioVenta: number | null;
}

export interface ProductCreateRequest {
  nombre: string;
  categoriaId: number | null;
  marca: string | null;
  precioVenta: number | null;
  /** Solo aplica cuando no se envían variantes. */
  stockInicial?: number;
  /** Solo aplica cuando no se envían variantes. */
  costoInicial?: number | null;
  variantes?: VariantCreateRequest[];
}

export interface ProductUpdateRequest {
  nombre: string;
  categoriaId: number | null;
  marca: string | null;
  precioVenta: number | null;
  activo: boolean;
}

export const LOW_STOCK_PRODUCT = 10;
export const LOW_STOCK_VARIANT = 2;

export const PRESET_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const PRESET_TALLAS_NUM = ['6', '8', '10', '12', '14', '16', '28', '30', '32', '34', '36', '38'];
export const PRESET_COLORES = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Café', 'Rosado', 'Amarillo'];

/** Texto corto de la variante: "Negro XL", o "Única" si no tiene talla ni color. */
export function variantLabel(v: Pick<ProductVariant, 'talla' | 'color'>): string {
  const parts = [v.color, v.talla].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Única';
}
