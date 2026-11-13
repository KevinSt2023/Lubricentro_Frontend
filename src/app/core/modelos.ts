// Contratos que devuelve el backend. Solo lo que el frontend consume.

export interface Perfil {
  tipo: string;
  usuarioId?: number;
  clienteId?: number;
  nombre: string;
  email: string;
  rolId?: number;
  rol?: string;
  empresaId?: number;
  empresa?: string;
  sedeId?: number;
  sede?: string;
  debeCambiarClave: boolean;
  planCodigo?: string;
  permisos: string[];
  funciones: string[];
}

export interface Sesion {
  token: string;
  refreshToken: string;
  expiraEn: string;
  audiencia: string;
  perfil: Perfil;
}

export interface ErrorApi {
  mensaje: string;
  codigo?: string;
}

// Paginacion (espejo de Pagina<T> del backend).
export interface Pagina<T> {
  items: T[];
  paginaActual: number;
  tamano: number;
  total: number;
  totalPaginas: number;
  hayMas: boolean;
}
