// Espejo de los contratos de la agenda (backend Fase 5).

export interface AgendaCita {
  id: number;
  numero: number;
  /** Instante en UTC (ISO). Se muestra en hora de Lima. */
  fechaCita: string;
  sedeId: number;
  sede?: string;
  clienteId: number;
  cliente?: string;
  telefono?: string;
  vehiculoId: number;
  placa?: string;
  vehiculo?: string;
  tecnicoId?: number;
  tecnico?: string;
  motivo?: string;
  creadoEn: string;
}

export interface CrearCita {
  clienteId: number;
  vehiculoId: number;
  sedeId: number;
  fechaCita: string;
  tecnicoId?: number;
  motivo?: string;
}

export interface ReprogramarCita {
  fechaCita: string;
  tecnicoId?: number;
}

export interface ProximoMantenimiento {
  vehiculoId: number;
  placa: string;
  vehiculo: string;
  clienteId: number;
  cliente?: string;
  telefono?: string;
  kilometraje: number;
  proximoMantFecha?: string;
  proximoMantKm?: number;
  diasRestantes?: number;
  kmRestantes?: number;
  vencido: boolean;
}
