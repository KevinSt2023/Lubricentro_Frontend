// Espejo de los contratos de cotizaciones y aprobaciones (backend Fase 4).

export type SeveridadHallazgo = 'LEVE' | 'MODERADO' | 'CRITICO';

export interface Hallazgo {
  id: number;
  descripcion: string;
  severidad: SeveridadHallazgo;
  atendido: boolean;
  autor?: string;
  creadoEn: string;
}

export type EstadoCotizacion =
  | 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'REEMPLAZADA' | 'VENCIDA';

export interface CotizacionRenglon {
  id: number;
  tipo: 'SERVICIO' | 'REPUESTO';
  servicioId?: number;
  productoId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CotizacionDecision {
  decision: 'APROBADA' | 'RECHAZADA';
  comentario?: string;
  canal: string;
  creadoEn: string;
}

export interface CotizacionItem {
  id: number;
  ordenId: number;
  numeroOrden: number;
  version: number;
  estado: EstadoCotizacion;
  total: number;
  moneda: string;
  vigenciaHasta?: string;
  enviadaEn?: string;
  decididaEn?: string;
  creadoEn: string;
}

export interface CotizacionDetalle extends CotizacionItem {
  nota?: string;
  autor?: string;
  placa?: string;
  vehiculo?: string;
  cliente?: string;
  renglones: CotizacionRenglon[];
  decision?: CotizacionDecision;
}

// Lo que arma el diálogo para crear o editar.
export interface RenglonPeticion {
  tipo: 'SERVICIO' | 'REPUESTO';
  servicioId?: number;
  productoId?: number;
  descripcion?: string;
  cantidad: number;
  precioUnitario?: number;
}
export interface GuardarCotizacion {
  nota?: string;
  vigenciaHasta?: string;
  renglones: RenglonPeticion[];
}

export const SEVERIDADES: SeveridadHallazgo[] = ['LEVE', 'MODERADO', 'CRITICO'];
