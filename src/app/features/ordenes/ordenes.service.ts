import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../core/modelos';
import {
  ChecklistPlantilla,
  EstadoOrden,
  OrdenDetalle,
  OrdenItem,
} from './ordenes.models';

function params(obj: Record<string, string | number | boolean | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== '') p = p.set(k, v);
  return p;
}

/** Todas las llamadas de órdenes de trabajo (api/ordenes/*). */
@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/ordenes';

  estados(): Observable<EstadoOrden[]> {
    return this.http.get<EstadoOrden[]>(`${this.base}/estados`);
  }

  listar(o: { pagina?: number; tamano?: number; buscar?: string; estadoId?: number; tecnicoId?: number; clienteId?: number; vehiculoId?: number }): Observable<Pagina<OrdenItem>> {
    return this.http.get<Pagina<OrdenItem>>(this.base, { params: params(o) });
  }

  ver(id: number): Observable<OrdenDetalle> {
    return this.http.get<OrdenDetalle>(`${this.base}/${id}`);
  }

  crear(b: unknown): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(this.base, b);
  }

  actualizar(id: number, b: unknown): Observable<OrdenDetalle> {
    return this.http.put<OrdenDetalle>(`${this.base}/${id}`, b);
  }

  cambiarEstado(id: number, estado: string, observacion?: string): Observable<OrdenDetalle> {
    return this.http.put<OrdenDetalle>(`${this.base}/${id}/estado`, { estado, observacion });
  }

  asignar(id: number, tecnicoId: number): Observable<OrdenDetalle> {
    return this.http.put<OrdenDetalle>(`${this.base}/${id}/tecnico`, { tecnicoId });
  }

  /** El técnico toma una orden sin asignar de su sede (se auto-asigna). */
  tomar(id: number): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(`${this.base}/${id}/tomar`, {});
  }

  anular(id: number, motivo: string): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(`${this.base}/${id}/anular`, { motivo });
  }

  agregarServicio(id: number, b: unknown): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(`${this.base}/${id}/servicios`, b);
  }
  quitarServicio(id: number, lineaId: number): Observable<OrdenDetalle> {
    return this.http.delete<OrdenDetalle>(`${this.base}/${id}/servicios/${lineaId}`);
  }

  consumir(id: number, b: unknown): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(`${this.base}/${id}/consumos`, b);
  }

  guardarChecklist(id: number, items: unknown): Observable<OrdenDetalle> {
    return this.http.put<OrdenDetalle>(`${this.base}/${id}/checklist`, { items });
  }

  subirEvidencia(id: number, b: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/evidencias`, b);
  }

  plantilla(): Observable<ChecklistPlantilla[]> {
    return this.http.get<ChecklistPlantilla[]>(`${this.base}/checklist-plantilla`, { params: params({ soloActivos: true }) });
  }
}
