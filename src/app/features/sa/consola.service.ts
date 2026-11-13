import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../core/modelos';
import {
  CrearEmpresa,
  EmpresaCreada,
  EmpresaDetalle,
  EmpresaLista,
  Funcion,
  Plan,
  SaludEmpresa,
  Sede,
  Suscripcion,
  Tablero,
  UsuarioGlobal,
} from './consola.models';

/** Todas las llamadas de la consola del SuperAdmin (api/sa/*). */
@Injectable({ providedIn: 'root' })
export class ConsolaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/sa';

  // --- Tablero ---
  tablero(): Observable<Tablero> {
    return this.http.get<Tablero>(`${this.base}/tablero`);
  }

  // --- Empresas ---
  empresas(opts: { pagina?: number; tamano?: number; buscar?: string; estado?: string; planId?: number }): Observable<Pagina<EmpresaLista>> {
    let p = new HttpParams();
    if (opts.pagina) p = p.set('pagina', opts.pagina);
    if (opts.tamano) p = p.set('tamano', opts.tamano);
    if (opts.buscar) p = p.set('buscar', opts.buscar);
    if (opts.estado) p = p.set('estado', opts.estado);
    if (opts.planId) p = p.set('planId', opts.planId);
    return this.http.get<Pagina<EmpresaLista>>(`${this.base}/empresas`, { params: p });
  }

  empresa(id: number): Observable<EmpresaDetalle> {
    return this.http.get<EmpresaDetalle>(`${this.base}/empresas/${id}`);
  }

  crearEmpresa(cuerpo: CrearEmpresa): Observable<EmpresaCreada> {
    return this.http.post<EmpresaCreada>(`${this.base}/empresas`, cuerpo);
  }

  actualizarEmpresa(id: number, cuerpo: Partial<CrearEmpresa>): Observable<EmpresaDetalle> {
    return this.http.put<EmpresaDetalle>(`${this.base}/empresas/${id}`, cuerpo);
  }

  cambiarPlan(id: number, planCodigo: string, motivo?: string): Observable<EmpresaDetalle> {
    return this.http.put<EmpresaDetalle>(`${this.base}/empresas/${id}/plan`, { planCodigo, motivo });
  }

  cambiarEstado(id: number, activo: boolean, motivo?: string): Observable<EmpresaDetalle> {
    return this.http.put<EmpresaDetalle>(`${this.base}/empresas/${id}/estado`, { activo, motivo });
  }

  salud(id: number): Observable<SaludEmpresa> {
    return this.http.get<SaludEmpresa>(`${this.base}/empresas/${id}/salud`);
  }

  reiniciarClaveAdmin(id: number): Observable<{ claveTemporal: string }> {
    return this.http.post<{ claveTemporal: string }>(`${this.base}/empresas/${id}/clave-admin`, {});
  }

  // --- Sedes de la empresa ---
  sedes(id: number): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.base}/empresas/${id}/sedes`);
  }

  crearSede(id: number, cuerpo: { nombre: string; direccion?: string; telefono?: string }): Observable<Sede> {
    return this.http.post<Sede>(`${this.base}/empresas/${id}/sedes`, cuerpo);
  }

  // --- Suscripciones ---
  suscripcionesDe(id: number, pagina = 1, tamano = 20): Observable<Pagina<Suscripcion>> {
    const p = new HttpParams().set('pagina', pagina).set('tamano', tamano);
    return this.http.get<Pagina<Suscripcion>>(`${this.base}/empresas/${id}/suscripciones`, { params: p });
  }

  registrarPago(id: number, meses: number, referencia?: string, monto?: number): Observable<Suscripcion> {
    return this.http.post<Suscripcion>(`${this.base}/empresas/${id}/suscripciones`, { meses, referencia, monto });
  }

  anularPago(suscripcionId: number, motivo: string): Observable<Suscripcion> {
    return this.http.post<Suscripcion>(`${this.base}/suscripciones/${suscripcionId}/anular`, { motivo });
  }

  // --- Usuarios globales (todas las empresas) ---
  usuarios(opts: { pagina?: number; tamano?: number; buscar?: string; empresaId?: number; rolId?: number; activo?: boolean }): Observable<Pagina<UsuarioGlobal>> {
    let p = new HttpParams();
    if (opts.pagina) p = p.set('pagina', opts.pagina);
    if (opts.tamano) p = p.set('tamano', opts.tamano);
    if (opts.buscar) p = p.set('buscar', opts.buscar);
    if (opts.empresaId) p = p.set('empresaId', opts.empresaId);
    if (opts.rolId) p = p.set('rolId', opts.rolId);
    if (opts.activo !== undefined) p = p.set('activo', opts.activo);
    return this.http.get<Pagina<UsuarioGlobal>>(`${this.base}/usuarios`, { params: p });
  }

  // --- Planes ---
  planes(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.base}/planes`);
  }

  funciones(): Observable<Funcion[]> {
    return this.http.get<Funcion[]>(`${this.base}/planes/funciones`);
  }
}
