import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../core/modelos';
import {
  Cliente,
  ClienteDetalle,
  MovimientoKardex,
  Personal,
  PersonalCreado,
  PortalHabilitado,
  Producto,
  ProductoDetalle,
  SedeSimple,
  Servicio,
  Vehiculo,
  VehiculoDetalle,
} from './maestros.models';

function params(obj: Record<string, string | number | boolean | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== '') p = p.set(k, v);
  return p;
}

/** Todas las llamadas de los maestros del taller (empresa desde el token). */
@Injectable({ providedIn: 'root' })
export class MaestrosService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Sedes de la empresa (para los combos) ---
  sedes(): Observable<SedeSimple[]> {
    return this.http.get<SedeSimple[]>(`${this.base}/sedes`);
  }

  // --- Personal ---
  personal(o: { pagina?: number; tamano?: number; buscar?: string; rolId?: number; activo?: boolean }): Observable<Pagina<Personal>> {
    return this.http.get<Pagina<Personal>>(`${this.base}/personal`, { params: params(o) });
  }
  crearPersonal(b: unknown): Observable<PersonalCreado> {
    return this.http.post<PersonalCreado>(`${this.base}/personal`, b);
  }
  editarPersonal(id: number, b: unknown): Observable<Personal> {
    return this.http.put<Personal>(`${this.base}/personal/${id}`, b);
  }
  estadoPersonal(id: number, activo: boolean): Observable<Personal> {
    return this.http.put<Personal>(`${this.base}/personal/${id}/estado`, { activo });
  }
  clavePersonal(id: number): Observable<{ claveTemporal: string }> {
    return this.http.post<{ claveTemporal: string }>(`${this.base}/personal/${id}/clave`, {});
  }

  // --- Clientes ---
  clientes(o: { pagina?: number; tamano?: number; buscar?: string; tipo?: string; activo?: boolean }): Observable<Pagina<Cliente>> {
    return this.http.get<Pagina<Cliente>>(`${this.base}/clientes`, { params: params(o) });
  }
  cliente(id: number): Observable<ClienteDetalle> {
    return this.http.get<ClienteDetalle>(`${this.base}/clientes/${id}`);
  }
  crearCliente(b: unknown): Observable<ClienteDetalle> {
    return this.http.post<ClienteDetalle>(`${this.base}/clientes`, b);
  }
  editarCliente(id: number, b: unknown): Observable<ClienteDetalle> {
    return this.http.put<ClienteDetalle>(`${this.base}/clientes/${id}`, b);
  }
  estadoCliente(id: number, activo: boolean): Observable<ClienteDetalle> {
    return this.http.put<ClienteDetalle>(`${this.base}/clientes/${id}/estado`, { activo });
  }
  habilitarPortal(id: number): Observable<PortalHabilitado> {
    return this.http.post<PortalHabilitado>(`${this.base}/clientes/${id}/portal`, {});
  }

  // --- Vehículos ---
  vehiculos(o: { pagina?: number; tamano?: number; buscar?: string; clienteId?: number; activo?: boolean }): Observable<Pagina<Vehiculo>> {
    return this.http.get<Pagina<Vehiculo>>(`${this.base}/vehiculos`, { params: params(o) });
  }
  vehiculo(id: number): Observable<VehiculoDetalle> {
    return this.http.get<VehiculoDetalle>(`${this.base}/vehiculos/${id}`);
  }
  crearVehiculo(b: unknown): Observable<VehiculoDetalle> {
    return this.http.post<VehiculoDetalle>(`${this.base}/vehiculos`, b);
  }
  editarVehiculo(id: number, b: unknown): Observable<VehiculoDetalle> {
    return this.http.put<VehiculoDetalle>(`${this.base}/vehiculos/${id}`, b);
  }
  estadoVehiculo(id: number, activo: boolean): Observable<VehiculoDetalle> {
    return this.http.put<VehiculoDetalle>(`${this.base}/vehiculos/${id}/estado`, { activo });
  }
  kilometraje(id: number, kilometraje: number): Observable<VehiculoDetalle> {
    return this.http.put<VehiculoDetalle>(`${this.base}/vehiculos/${id}/kilometraje`, { kilometraje });
  }

  // --- Servicios ---
  servicios(o: { pagina?: number; tamano?: number; buscar?: string; categoria?: string; activo?: boolean }): Observable<Pagina<Servicio>> {
    return this.http.get<Pagina<Servicio>>(`${this.base}/servicios`, { params: params(o) });
  }
  crearServicio(b: unknown): Observable<Servicio> {
    return this.http.post<Servicio>(`${this.base}/servicios`, b);
  }
  editarServicio(id: number, b: unknown): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.base}/servicios/${id}`, b);
  }
  estadoServicio(id: number, activo: boolean): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.base}/servicios/${id}/estado`, { activo });
  }

  // --- Almacén ---
  productos(o: { pagina?: number; tamano?: number; buscar?: string; tipo?: string; activo?: boolean; bajoMinimo?: boolean }): Observable<Pagina<Producto>> {
    return this.http.get<Pagina<Producto>>(`${this.base}/almacen/productos`, { params: params(o) });
  }
  producto(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalle>(`${this.base}/almacen/productos/${id}`);
  }
  crearProducto(b: unknown): Observable<ProductoDetalle> {
    return this.http.post<ProductoDetalle>(`${this.base}/almacen/productos`, b);
  }
  editarProducto(id: number, b: unknown): Observable<ProductoDetalle> {
    return this.http.put<ProductoDetalle>(`${this.base}/almacen/productos/${id}`, b);
  }
  estadoProducto(id: number, activo: boolean): Observable<ProductoDetalle> {
    return this.http.put<ProductoDetalle>(`${this.base}/almacen/productos/${id}/estado`, { activo });
  }
  ingresar(id: number, b: unknown): Observable<ProductoDetalle> {
    return this.http.post<ProductoDetalle>(`${this.base}/almacen/productos/${id}/ingresos`, b);
  }
  ajustar(id: number, b: unknown): Observable<ProductoDetalle> {
    return this.http.post<ProductoDetalle>(`${this.base}/almacen/productos/${id}/ajustes`, b);
  }
  kardex(id: number, pagina = 1, tamano = 20): Observable<Pagina<MovimientoKardex>> {
    return this.http.get<Pagina<MovimientoKardex>>(`${this.base}/almacen/productos/${id}/kardex`, { params: params({ pagina, tamano }) });
  }
}
