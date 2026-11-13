import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil, Sesion } from './modelos';

const LLAVE_TOKEN = 'lt-token';
const LLAVE_REFRESH = 'lt-refresh';
const LLAVE_PERFIL = 'lt-perfil';

/**
 * El estado de la sesion del ERP. Guarda el token y el perfil, y expone
 * signals para que la app reaccione. El refresh rotativo lo dispara el
 * interceptor; aqui vive el guardado y la lectura.
 *
 * El frontend ERP manda SIEMPRE la cabecera X-App: ERP_WEB (lo pone el
 * interceptor) y usa la audiencia del ERP: una cuenta de cliente no entra.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly base = environment.apiUrl;

  readonly perfil = signal<Perfil | null>(this.leerPerfil());
  readonly autenticado = computed(() => this.perfil() !== null);

  /** El dueño del SaaS. No pertenece a ninguna empresa: opera la consola, no un taller. */
  readonly esSuperAdmin = computed(() => this.perfil()?.rolId === 0);

  constructor(private http: HttpClient) {}

  get token(): string | null {
    try {
      return localStorage.getItem(LLAVE_TOKEN);
    } catch {
      return null;
    }
  }

  get refreshToken(): string | null {
    try {
      return localStorage.getItem(LLAVE_REFRESH);
    } catch {
      return null;
    }
  }

  ingresar(email: string, password: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.base}/auth/login`, { email, password })
      .pipe(tap((s) => this.guardar(s)));
  }

  cambiarClave(claveActual: string, claveNueva: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/cambiar-clave`, { claveActual, claveNueva });
  }

  refrescar(): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.base}/auth/refrescar`, { refreshToken: this.refreshToken })
      .pipe(tap((s) => this.guardar(s)));
  }

  salir(): void {
    const rt = this.refreshToken;
    if (rt) {
      this.http.post(`${this.base}/auth/cerrar`, { refreshToken: rt }).subscribe({
        next: () => {},
        error: () => {},
      });
    }
    this.limpiar();
  }

  guardar(s: Sesion): void {
    try {
      localStorage.setItem(LLAVE_TOKEN, s.token);
      localStorage.setItem(LLAVE_REFRESH, s.refreshToken);
      localStorage.setItem(LLAVE_PERFIL, JSON.stringify(s.perfil));
    } catch {
      /* modo privado: la sesion vive solo en memoria */
    }
    this.perfil.set(s.perfil);
  }

  limpiar(): void {
    try {
      localStorage.removeItem(LLAVE_TOKEN);
      localStorage.removeItem(LLAVE_REFRESH);
      localStorage.removeItem(LLAVE_PERFIL);
    } catch {
      /* nada */
    }
    this.perfil.set(null);
  }

  /**
   * Permiso efectivo de un usuario de EMPRESA. El SuperAdmin NO entra aqui: no
   * es un usuario de taller, no tiene matriz de empresa y no debe ver clientes,
   * vehiculos ni almacen. Su mundo es la consola (ver esSuperAdmin).
   */
  puede(permiso: string): boolean {
    const p = this.perfil();
    if (!p || p.rolId === 0) return false;
    return p.permisos.includes(permiso);
  }

  /** Tiene al menos uno de los permisos. */
  puedeAlguno(...permisos: string[]): boolean {
    return permisos.some((x) => this.puede(x));
  }

  tieneFuncion(funcion: string): boolean {
    return this.perfil()?.funciones.includes(funcion) ?? false;
  }

  private leerPerfil(): Perfil | null {
    try {
      const raw = localStorage.getItem(LLAVE_PERFIL);
      return raw ? (JSON.parse(raw) as Perfil) : null;
    } catch {
      return null;
    }
  }
}
