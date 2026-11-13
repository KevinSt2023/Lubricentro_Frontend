import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CotizacionDetalle,
  CotizacionItem,
  GuardarCotizacion,
  Hallazgo,
  SeveridadHallazgo,
} from './cotizaciones.models';

/** Lado del taller de las cotizaciones (backend Fase 4). El cliente decide desde su portal. */
@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Hallazgos ---
  hallazgos(ordenId: number): Observable<Hallazgo[]> {
    return this.http.get<Hallazgo[]>(`${this.base}/ordenes/${ordenId}/hallazgos`);
  }
  registrarHallazgo(ordenId: number, b: { descripcion: string; severidad: SeveridadHallazgo }): Observable<Hallazgo> {
    return this.http.post<Hallazgo>(`${this.base}/ordenes/${ordenId}/hallazgos`, b);
  }
  quitarHallazgo(ordenId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/ordenes/${ordenId}/hallazgos/${id}`);
  }

  // --- Cotizaciones ---
  porOrden(ordenId: number): Observable<CotizacionItem[]> {
    return this.http.get<CotizacionItem[]>(`${this.base}/ordenes/${ordenId}/cotizaciones`);
  }
  ver(id: number): Observable<CotizacionDetalle> {
    return this.http.get<CotizacionDetalle>(`${this.base}/cotizaciones/${id}`);
  }
  crear(ordenId: number, b: GuardarCotizacion): Observable<CotizacionDetalle> {
    return this.http.post<CotizacionDetalle>(`${this.base}/ordenes/${ordenId}/cotizaciones`, b);
  }
  actualizar(id: number, b: GuardarCotizacion): Observable<CotizacionDetalle> {
    return this.http.put<CotizacionDetalle>(`${this.base}/cotizaciones/${id}`, b);
  }
  enviar(id: number): Observable<CotizacionDetalle> {
    return this.http.post<CotizacionDetalle>(`${this.base}/cotizaciones/${id}/enviar`, {});
  }
  aplicar(id: number): Observable<CotizacionDetalle> {
    return this.http.post<CotizacionDetalle>(`${this.base}/cotizaciones/${id}/aplicar`, {});
  }
}
