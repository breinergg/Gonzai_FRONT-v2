export interface LoginRequest {
  email: string;
  password: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface TokenResponse {
  token: string;
  usuario: UsuarioResponse;
}
