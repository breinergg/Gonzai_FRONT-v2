export interface ChatRequest {
  usuarioId?: number | null;
  pregunta: string;
  usarHistorialDeBd?: boolean;
  historial?: { role: string; text: string }[] | null;
}

export interface ChatResponse {
  chatLogId: number;
  pregunta:  string;
  respuesta: string;
  fecha:     string;
}
