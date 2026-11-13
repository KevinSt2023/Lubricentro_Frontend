// Espejo de los contratos de la consola SuperAdmin del backend.

export interface EmpresaLista {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  telefono?: string;
  email?: string;
  planId: number;
  plan: string;
  activo: boolean;
  servicioHasta: string;
  diasRestantes: number;
  estadoServicio: 'AL_DIA' | 'POR_VENCER' | 'VENCIDO' | 'INACTIVA';
  sedes: number;
  usuarios: number;
  creadoEn: string;
}

export interface UsoDeRol {
  rolId: number;
  rol: string;
  cupo: number | null;
  usados: number;
  excedido: boolean;
}

export interface Sede {
  id: number;
  empresaId: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  esPrincipal: boolean;
  activo: boolean;
  usuarios: number;
}

export interface Suscripcion {
  id: number;
  empresaId: number;
  empresa?: string;
  planId: number;
  plan?: string;
  desde: string;
  hasta: string;
  monto: number;
  estado: string;
  referencia?: string;
  registradoEn: string;
  dias: number;
}

export interface AdminDeEmpresa {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  debeCambiarClave: boolean;
  ultimoAcceso?: string;
}

export interface EmpresaDetalle extends EmpresaLista {
  direccion?: string;
  precioMensual: number;
  listaSedes: Sede[];
  funciones: string[];
  usoPorRol: UsoDeRol[];
  maxSedes: number;
  ultimaSuscripcion?: Suscripcion;
  admin?: AdminDeEmpresa;
}

export interface EmpresaCreada {
  empresa: EmpresaDetalle;
  emailAdmin: string;
  claveTemporal: string;
}

export interface CupoDeRol {
  rolId: number;
  rol?: string;
  cupo: number;
}

export interface Plan {
  id: number;
  codigo: string;
  nombre: string;
  precioMensual: number;
  maxSedes: number;
  orden: number;
  activo: boolean;
  funciones: string[];
  cupos: CupoDeRol[];
  empresas: number;
}

export interface Funcion {
  codigo: string;
  nombre: string;
  descripcion?: string;
  grupo: string;
  orden: number;
}

export interface SaludEmpresa {
  empresaId: number;
  empresa: string;
  estadoServicio: string;
  diasRestantes: number;
  servicioHasta: string;
  plan: string;
  usoPorRol: UsoDeRol[];
  sedesUsadas: number;
  maxSedes: number;
  sedesExcedidas: boolean;
  funciones: string[];
  tieneAdmin: boolean;
  ultimoAccesoDeAlguien?: string;
  alertas: string[];
}

export interface ConteoPorPlan {
  planId: number;
  plan: string;
  empresas: number;
  precioMensual: number;
}

export interface Tablero {
  empresas: number;
  activas: number;
  inactivas: number;
  alDia: number;
  porVencer: number;
  vencidas: number;
  ingresoMesActual: number;
  ingresoMesAnterior: number;
  ingresoRecurrenteMensual: number;
  porPlan: ConteoPorPlan[];
  porVencerPronto: EmpresaLista[];
  ultimosPagos: Suscripcion[];
}

// Peticiones
export interface AdminNuevo {
  dni?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
}
export interface SedeNueva {
  nombre: string;
  direccion?: string;
  telefono?: string;
}
export interface CrearEmpresa {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  planCodigo: string;
  diasDeCortesia: number;
  admin: AdminNuevo;
  sedePrincipal: SedeNueva;
}

// Usuario visto desde la consola del SuperAdmin (cruza empresas).
export interface UsuarioGlobal {
  id: number;
  nombre: string;
  email: string;
  dni?: string;
  telefono?: string;
  rolId: number;
  rol?: string;
  empresaId?: number;
  empresa?: string;
  sedeId?: number;
  sede?: string;
  activo: boolean;
  debeCambiarClave: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
}
