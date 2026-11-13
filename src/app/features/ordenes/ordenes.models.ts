// Espejo de los contratos de órdenes de trabajo (backend Fase 3).

export interface EstadoOrden {
  id: number;
  codigo: string;
  nombre: string;
  secuencia: number;
  esFinal: boolean;
  esAnulacion: boolean;
}

export interface OrdenItem {
  id: number;
  numero: number;
  estadoId: number;
  estado: string;
  estadoFinal: boolean;
  sedeId: number;
  sede?: string;
  clienteId: number;
  cliente?: string;
  vehiculoId: number;
  placa?: string;
  vehiculo?: string;
  tecnicoId?: number;
  tecnico?: string;
  total: number;
  creadoEn: string;
}

export interface OrdenServicio {
  id: number;
  servicioId?: number;
  descripcion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}
export interface OrdenConsumo {
  id: number;
  productoId: number;
  producto?: string;
  codigo?: string;
  sedeId: number;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
  costoUnitario?: number;
  creadoEn: string;
}
export interface ChecklistRespuesta {
  id: number;
  item: string;
  resultado: 'OK' | 'OBSERVADO' | 'MALO' | 'NA';
  nota?: string;
}
export interface OrdenEvidencia {
  id: number;
  tipo: string;
  nombre?: string;
  mime: string;
  bytes: number;
  url: string;
  subidoPor?: string;
  creadoEn: string;
}
export interface OrdenHistorial {
  id: number;
  estadoAnterior?: string;
  estadoNuevo: string;
  usuario?: string;
  observacion?: string;
  creadoEn: string;
}

export interface OrdenDetalle extends OrdenItem {
  asesorId?: number;
  asesor?: string;
  kilometrajeIngreso?: number;
  diagnostico?: string;
  observaciones?: string;
  fechaCita?: string;
  recibidoEn?: string;
  entregadoEn?: string;
  anuladaMotivo?: string;
  totalServicios: number;
  totalRepuestos: number;
  costoRepuestos?: number;
  margen?: number;
  servicios: OrdenServicio[];
  consumos: OrdenConsumo[];
  checklist: ChecklistRespuesta[];
  evidencias: OrdenEvidencia[];
  historial: OrdenHistorial[];
}

export interface ChecklistPlantilla {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export const RESULTADOS_CHECK = ['OK', 'OBSERVADO', 'MALO', 'NA'] as const;
