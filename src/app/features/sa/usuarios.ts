import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsolaService } from './consola.service';
import { UsuarioGlobal } from './consola.models';
import { Pagina } from '../../core/modelos';

const ROLES_SA: Record<number, string> = {
  0: 'SuperAdmin', 1: 'Admin', 2: 'Gerente', 3: 'Contador', 4: 'Supervisor',
  5: 'Asesor', 6: 'Técnico', 7: 'Cajero', 8: 'Almacenero',
};

/** Padrón global de usuarios: todas las empresas, para el SuperAdmin. */
@Component({
  selector: 'lt-sa-usuarios',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="relative w-64">
        <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue !text-xl pointer-events-none">search</mat-icon>
        <input class="lt-input !pl-10" placeholder="Nombre, correo o DNI" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
      </div>
      <select class="lt-input !w-56" [(ngModel)]="empresaId" (change)="recargar()">
        <option [ngValue]="0">Todas las empresas</option>
        @for (e of empresas(); track e.id) { <option [ngValue]="e.id">{{ e.nombre }}</option> }
      </select>
      <select class="lt-input !w-44" [(ngModel)]="rolId" (change)="recargar()">
        <option [ngValue]="-1">Todos los roles</option>
        @for (r of roles; track r.id) { <option [ngValue]="r.id">{{ r.nombre }}</option> }
      </select>
      <select class="lt-input !w-40" [(ngModel)]="estado" (change)="recargar()">
        <option value="">Todos</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>
    </div>

    <div class="rounded-2xl border border-borde bg-superficie overflow-hidden">
      @if (cargando()) {
        <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
      } @else if (pagina(); as pg) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-texto-tenue text-xs uppercase border-b border-borde bg-superficie-2">
              <tr>
                <th class="text-left font-medium px-4 py-3">Usuario</th>
                <th class="text-left font-medium px-4 py-3">Empresa</th>
                <th class="text-left font-medium px-4 py-3">Rol</th>
                <th class="text-left font-medium px-4 py-3">Documento</th>
                <th class="text-left font-medium px-4 py-3">Último acceso</th>
                <th class="text-center font-medium px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (u of pg.items; track u.id) {
                <tr class="hover:bg-superficie-2" [class.opacity-50]="!u.activo">
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ u.nombre }}</div>
                    <div class="text-xs text-texto-tenue">{{ u.email }}</div>
                  </td>
                  <td class="px-4 py-3">
                    @if (u.empresa) { <span class="text-texto-tenue">{{ u.empresa }}</span> }
                    @else { <span class="text-xs px-2 py-0.5 rounded-full bg-marca-soft text-marca font-medium">Plataforma</span> }
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-acero-400/15 text-texto font-medium">{{ u.rol || rolNombre(u.rolId) }}</span>
                  </td>
                  <td class="px-4 py-3 text-texto-tenue">{{ u.dni || u.telefono || '—' }}</td>
                  <td class="px-4 py-3 text-texto-tenue">{{ u.ultimoAcceso ? (u.ultimoAcceso | date: 'dd/MM/yy HH:mm') : 'nunca' }}</td>
                  <td class="px-4 py-3 text-center">
                    @if (u.activo) { <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Activo</span> }
                    @else { <span class="text-xs px-2 py-0.5 rounded-full bg-acero-400/15 text-texto-tenue font-medium">Inactivo</span> }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="text-center text-texto-tenue py-10">No hay usuarios con esos filtros.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} usuario(s)</span>
          <div class="flex items-center gap-2">
            <button mat-icon-button [disabled]="pg.paginaActual<=1" (click)="ir(pg.paginaActual-1)"><mat-icon>chevron_left</mat-icon></button>
            <span>{{ pg.paginaActual }} / {{ pg.totalPaginas||1 }}</span>
            <button mat-icon-button [disabled]="!pg.hayMas" (click)="ir(pg.paginaActual+1)"><mat-icon>chevron_right</mat-icon></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class SaUsuarios {
  private api = inject(ConsolaService);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<UsuarioGlobal> | null>(null);
  readonly empresas = signal<{ id: number; nombre: string }[]>([]);
  readonly roles = Object.entries(ROLES_SA).map(([id, nombre]) => ({ id: Number(id), nombre }));

  buscar = '';
  empresaId = 0;
  rolId = -1;
  estado = '';
  private pag = 1;

  constructor() {
    this.api.empresas({ tamano: 200 }).subscribe((pg) =>
      this.empresas.set(pg.items.map((e) => ({ id: e.id, nombre: e.nombreComercial }))));
    this.cargar();
  }

  recargar() { this.pag = 1; this.cargar(); }
  ir(p: number) { this.pag = p; this.cargar(); }

  rolNombre(id: number) { return ROLES_SA[id] ?? `Rol ${id}`; }

  private cargar() {
    this.cargando.set(true);
    this.api.usuarios({
      pagina: this.pag, tamano: 20,
      buscar: this.buscar || undefined,
      empresaId: this.empresaId || undefined,
      rolId: this.rolId >= 0 ? this.rolId : undefined,
      activo: this.estado === '' ? undefined : this.estado === 'activo',
    }).subscribe({
      next: (pg) => { this.pagina.set(pg); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
}
