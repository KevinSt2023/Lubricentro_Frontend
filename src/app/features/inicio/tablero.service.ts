import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConteoEstado { estadoId: number; estado: string; secuencia: number; cantidad: number; }
export interface CargaTecnico { tecnico: string; cantidad: number; }
export interface OrdenMini {
  id: number; numero: number; placa?: string; cliente?: string;
  estado: string; estadoFinal: boolean; total: number; creadoEn: string;
}
export interface TableroTaller {
  ordenesAbiertas: number;
  ordenesHoy: number;
  cotizacionesPendientes: number;
  productosBajoMinimo: number;
  valorTrabajosMes: number;
  porEstado: ConteoEstado[];
  cargaPorTecnico: CargaTecnico[];
  ultimasOrdenes: OrdenMini[];
}

/** El tablero operativo del taller (api/tablero). */
@Injectable({ providedIn: 'root' })
export class TableroService {
  private http = inject(HttpClient);
  tablero(): Observable<TableroTaller> {
    return this.http.get<TableroTaller>(`${environment.apiUrl}/tablero`);
  }
}
