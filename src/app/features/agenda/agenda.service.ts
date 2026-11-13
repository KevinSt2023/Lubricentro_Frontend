import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgendaCita, CrearCita, ProximoMantenimiento, ReprogramarCita } from './agenda.models';
import { OrdenDetalle } from '../ordenes/ordenes.models';

/** Llamadas de la agenda (api/agenda/*). Una cita es una orden en Cita registrada. */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/agenda';

  listar(o: { desde: string; hasta: string; sedeId?: number; tecnicoId?: number }): Observable<AgendaCita[]> {
    let p = new HttpParams().set('desde', o.desde).set('hasta', o.hasta);
    if (o.sedeId) p = p.set('sedeId', o.sedeId);
    if (o.tecnicoId) p = p.set('tecnicoId', o.tecnicoId);
    return this.http.get<AgendaCita[]>(this.base, { params: p });
  }

  agendar(b: CrearCita): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(this.base, b);
  }

  reprogramar(id: number, b: ReprogramarCita): Observable<AgendaCita> {
    return this.http.put<AgendaCita>(`${this.base}/${id}`, b);
  }

  recibir(id: number, kilometrajeIngreso?: number): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(`${this.base}/${id}/recibir`, { kilometrajeIngreso });
  }

  cancelar(id: number, motivo: string): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(`${this.base}/${id}/cancelar`, { motivo });
  }

  proximosMantenimientos(o?: { dias?: number; km?: number }): Observable<ProximoMantenimiento[]> {
    let p = new HttpParams();
    if (o?.dias) p = p.set('dias', o.dias);
    if (o?.km) p = p.set('km', o.km);
    return this.http.get<ProximoMantenimiento[]>(`${this.base}/proximos-mantenimientos`, { params: p });
  }
}
