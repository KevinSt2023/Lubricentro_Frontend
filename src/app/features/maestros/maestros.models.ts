// Espejo de los contratos de los maestros del taller (backend Fase 2).

export const ROLES: Record<number, string> = {
  1: 'Admin',
  2: 'Gerente',
  3: 'Contador',
  4: 'Supervisor',
  5: 'Asesor de servicio',
  6: 'Técnico',
  7: 'Cajero',
  8: 'Almacenero',
};

export const TIPOS_VEHICULO = ['AUTO', 'CAMIONETA', 'SUV', 'CAMION', 'BUS', 'MOTO', 'OTRO'];

// Marcas más comunes en el parque automotor peruano. Es una ayuda, no una
// jaula: el campo acepta texto libre para marcas fuera de la lista.
export const MARCAS_VEHICULO = [
  'Toyota', 'Hyundai', 'Kia', 'Nissan', 'Suzuki', 'Chevrolet', 'Volkswagen',
  'Honda', 'Mitsubishi', 'Mazda', 'Ford', 'Renault', 'Peugeot', 'Changan',
  'JAC', 'Great Wall', 'BYD', 'Chery', 'Subaru', 'Mercedes-Benz', 'BMW', 'Audi',
];

export const COLORES_VEHICULO = [
  'Blanco', 'Negro', 'Plata', 'Gris', 'Rojo', 'Azul', 'Verde', 'Beige',
  'Dorado', 'Marrón', 'Amarillo', 'Naranja', 'Vino', 'Celeste',
];

/** Años de fabricación, del actual (más probable) hacia atrás. */
export function aniosVehiculo(desde = 1990): number[] {
  const hasta = new Date().getFullYear() + 1;
  const lista: number[] = [];
  for (let a = hasta; a >= desde; a--) lista.push(a);
  return lista;
}
export const TIPOS_PRODUCTO = ['REPUESTO', 'INSUMO', 'ACEITE', 'FILTRO', 'LLANTA', 'OTRO'];
export const UNIDADES = ['UND', 'LT', 'GAL', 'KG', 'JGO', 'MT', 'CAJA'];
export const TIPOS_DOC = ['DNI', 'RUC', 'CE', 'PASAPORTE', 'SIN_DOCUMENTO'];

export interface Personal {
  id: number;
  dni?: string;
  nombre: string;
  email: string;
  telefono?: string;
  rolId: number;
  rol: string;
  sedeId?: number;
  sede?: string;
  activo: boolean;
  debeCambiarClave: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
}
export interface PersonalCreado {
  personal: Personal;
  claveTemporal: string;
}

export interface Cliente {
  id: number;
  tipo: 'PARTICULAR' | 'EMPRESA';
  tipoDocumento: string;
  documento?: string;
  nombre: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  vehiculos: number;
  tienePortal: boolean;
  creadoEn: string;
}
export interface ClienteDetalle extends Cliente {
  nombres?: string;
  apellidos?: string;
  razonSocial?: string;
  direccion?: string;
  listaVehiculos: Vehiculo[];
}
export interface PortalHabilitado {
  email: string;
  claveTemporal: string;
}

export interface Vehiculo {
  id: number;
  clienteId: number;
  cliente?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  tipo: string;
  color?: string;
  kilometraje: number;
  activo: boolean;
}
export interface VehiculoDetalle extends Vehiculo {
  vin?: string;
  motor?: string;
  combustible?: string;
  transmision?: string;
  notas?: string;
  creadoEn: string;
}

export interface Servicio {
  id: number;
  codigo: string;
  nombre: string;
  categoria?: string;
  precio: number;
  duracionMin?: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  categoria?: string;
  tipo: string;
  unidad: string;
  precioVenta: number;
  stockMinimo: number;
  controlaStock: boolean;
  activo: boolean;
  stockTotal: number;
  bajoMinimo: boolean;
}
export interface StockSede {
  sedeId: number;
  sede: string;
  cantidad: number;
  costoPromedio: number;
}
export interface ProductoDetalle extends Producto {
  marca?: string;
  creadoEn: string;
  stock: StockSede[];
}
export interface MovimientoKardex {
  id: number;
  productoId: number;
  producto?: string;
  sedeId: number;
  sede?: string;
  tipo: string;
  cantidad: number;
  costoUnitario: number;
  saldo: number;
  referencia?: string;
  motivo?: string;
  usuario?: string;
  creadoEn: string;
}

export interface SedeSimple {
  id: number;
  nombre: string;
  esPrincipal: boolean;
  activo: boolean;
}
