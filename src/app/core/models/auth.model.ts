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

export interface UserCreateRequest {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface UserUpdateRequest {
  nombre: string;
  rol: string;
  activo: boolean;
}
