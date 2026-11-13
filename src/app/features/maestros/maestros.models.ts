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

/**
 * Modelos más vendidos en el Perú por marca. Alimenta el combo de Modelo, que
 * depende de la Marca elegida. Es una ayuda, no una jaula: el combo acepta
 * texto libre para modelos fuera de la lista.
 */
export const MODELOS_POR_MARCA: Record<string, string[]> = {
  Toyota: ['Yaris', 'Corolla', 'Corolla Cross', 'Hilux', 'RAV4', 'Fortuner', 'Land Cruiser', 'Land Cruiser Prado', 'Rush', 'Raize', 'Avanza', 'Camry', 'Prius', 'Hiace', '4Runner', 'Tacoma'],
  Hyundai: ['Grand i10', 'i10', 'i20', 'Accent', 'Elantra', 'Creta', 'Tucson', 'Santa Fe', 'Kona', 'Venue', 'Palisade', 'Sonata', 'H1', 'Porter', 'Staria'],
  Kia: ['Picanto', 'Rio', 'Soluto', 'Cerato', 'Stonic', 'Seltos', 'Sportage', 'Sorento', 'Carnival', 'Niro', 'K2500', 'Frontier'],
  Nissan: ['March', 'Versa', 'Sentra', 'Note', 'Kicks', 'Qashqai', 'X-Trail', 'Murano', 'Pathfinder', 'Frontier', 'NP300', 'Tiida'],
  Suzuki: ['S-Presso', 'Celerio', 'Swift', 'Dzire', 'Baleno', 'Ciaz', 'Ertiga', 'XL7', 'Vitara', 'Grand Vitara', 'Jimny', 'SX4'],
  Chevrolet: ['Spark', 'Beat', 'Sail', 'Onix', 'Groove', 'Tracker', 'Captiva', 'Equinox', 'Cruze', 'Colorado', 'N300', 'Blazer', 'Camaro'],
  Volkswagen: ['Gol', 'Polo', 'Virtus', 'Vento', 'Jetta', 'Golf', 'Passat', 'T-Cross', 'Nivus', 'Taos', 'Tiguan', 'Amarok', 'Saveiro'],
  Honda: ['City', 'Civic', 'Accord', 'Fit', 'BR-V', 'WR-V', 'HR-V', 'CR-V', 'Pilot', 'Odyssey'],
  Mitsubishi: ['Mirage', 'Lancer', 'Xpander', 'ASX', 'Eclipse Cross', 'Outlander', 'Montero Sport', 'Montero', 'L200'],
  Mazda: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-9', 'BT-50'],
  Ford: ['Fiesta', 'Focus', 'EcoSport', 'Escape', 'Territory', 'Edge', 'Explorer', 'Ranger', 'Everest', 'F-150', 'Bronco Sport', 'Mustang'],
  Renault: ['Kwid', 'Sandero', 'Stepway', 'Logan', 'Kardian', 'Duster', 'Captur', 'Koleos', 'Oroch', 'Megane', 'Fluence'],
  Peugeot: ['208', '2008', '301', '308', '408', '3008', '5008', 'Partner', 'Expert', 'Landtrek'],
  Changan: ['Alsvin', 'Eado', 'CS15', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'CS95', 'UNI-T', 'UNI-K', 'Hunter', 'Star'],
  JAC: ['S2', 'S3', 'S4', 'S7', 'J7', 'T6', 'T8', 'Sunray', 'X200', 'Refine'],
  'Great Wall': ['Wingle 5', 'Wingle 7', 'Poer', 'Haval H2', 'Haval H6', 'Haval Jolion', 'Ora'],
  BYD: ['F3', 'Qin', 'Dolphin', 'Yuan Pro', 'Yuan Plus', 'Song Plus', 'Han', 'Seal', 'Tang'],
  Chery: ['QQ', 'Tiggo 2', 'Tiggo 2 Pro', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Tiggo 8 Pro', 'Arrizo 5', 'Omoda 5'],
  Subaru: ['Impreza', 'XV', 'Crosstrek', 'Forester', 'Outback', 'Legacy', 'WRX', 'Ascent', 'BRZ'],
  'Mercedes-Benz': ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'Sprinter', 'Vito'],
  BMW: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
};

/** Modelos de una marca (vacío si la marca es libre / no catalogada). */
export function modelosDe(marca: string | number | undefined | null): string[] {
  if (!marca) return [];
  return MODELOS_POR_MARCA[String(marca).trim()] ?? [];
}

export const TIPOS_PRODUCTO = ['REPUESTO', 'INSUMO', 'ACEITE', 'FILTRO', 'LLANTA', 'OTRO'];
export const UNIDADES = ['UND', 'LT', 'GAL', 'KG', 'JGO', 'MT', 'CAJA'];
export const TIPOS_DOC = ['DNI', 'RUC', 'CE', 'PASAPORTE', 'SIN_DOCUMENTO'];

/**
 * Subcategorías de producto, dependientes del Tipo. Alimentan el combo de
 * Categoría del producto. Acepta texto libre para casos fuera de la lista.
 */
export const SUBCATEGORIAS_PRODUCTO: Record<string, string[]> = {
  ACEITE: ['Motor', 'Caja / Transmisión', 'Transmisión automática (ATF)', 'Hidráulico', 'Dirección', 'Diferencial', 'Líquido de frenos', 'Refrigerante', 'Grasa'],
  FILTRO: ['Aceite', 'Aire', 'Combustible', 'Habitáculo / Polen', 'Secador', 'Transmisión'],
  LLANTA: ['Aro 13', 'Aro 14', 'Aro 15', 'Aro 16', 'Aro 17', 'Aro 18', 'Aro 19', 'Aro 20', 'Cámara', 'Llanta de repuesto'],
  REPUESTO: ['Motor', 'Frenos', 'Suspensión', 'Dirección', 'Transmisión', 'Embrague', 'Sistema eléctrico', 'Encendido', 'Refrigeración', 'Escape', 'Correas y fajas', 'Rodamientos', 'Sensores', 'Carrocería'],
  INSUMO: ['Limpieza', 'Aditivos', 'Lubricantes', 'Selladores y pegamentos', 'Seguridad', 'Trapos y absorbentes', 'Guantes', 'Herramientas'],
  OTRO: ['Accesorios', 'Servicios', 'Varios'],
};

/** Subcategorías para un Tipo de producto (todas las conocidas si no hay tipo). */
export function categoriasProductoDe(tipo: string | number | undefined | null): string[] {
  const t = tipo ? String(tipo).trim().toUpperCase() : '';
  if (t && SUBCATEGORIAS_PRODUCTO[t]) return SUBCATEGORIAS_PRODUCTO[t];
  return [...new Set(Object.values(SUBCATEGORIAS_PRODUCTO).flat())].sort();
}

/** Categorías del catálogo de servicios del taller. */
export const CATEGORIAS_SERVICIO = [
  'Mantenimiento preventivo', 'Cambio de aceite', 'Afinamiento', 'Frenos',
  'Suspensión y dirección', 'Motor', 'Transmisión', 'Embrague',
  'Sistema eléctrico', 'Batería', 'Aire acondicionado', 'Refrigeración',
  'Llantas y alineación', 'Escape', 'Diagnóstico por escáner',
  'Carrocería y pintura', 'Lavado y detallado', 'Inspección técnica',
];

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
  proximoMantFecha?: string;
  proximoMantKm?: number;
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
