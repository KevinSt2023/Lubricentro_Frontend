import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaestrosService } from './maestros.service';
import { Personal as PersonalModel, ROLES, SedeSimple } from './maestros.models';
import { Pagina, ErrorApi } from '../../core/modelos';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { ClaveDialog } from '../../shared/clave-dialog';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-personal',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Personal</h1>
        <p class="text-texto-tenue text-sm">El equipo del taller.</p>
      </div>
      @if (sesion.puede('PERSONAL.CREAR')) {
        <button mat-flat-button color="primary" (click)="form()"><mat-icon>add</mat-icon> Nueva persona</button>
      }
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <mat-form-field appearance="outline" class="!w-64" subscriptSizing="dynamic">
        <mat-icon matPrefix class="text-texto-tenue !ml-2">search</mat-icon>
        <input matInput placeholder="Nombre, correo o DNI" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="!w-48" subscriptSizing="dynamic">
        <mat-label>Rol</mat-label>
        <mat-select [(ngModel)]="rolId" (selectionChange)="recargar()">
          <mat-option [value]="0">Todos</mat-option>
          @for (r of rolesLista; track r.id) { <mat-option [value]="r.id">{{ r.nombre }}</mat-option> }
        </mat-select>
      </mat-form-field>
    </div>

    <div class="rounded-2xl border border-borde bg-superficie overflow-hidden">
      @if (cargando()) {
        <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
      } @else if (pagina(); as pg) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-texto-tenue text-xs uppercase border-b border-borde bg-superficie-2">
              <tr>
                <th class="text-left font-medium px-4 py-3">Nombre</th>
                <th class="text-left font-medium px-4 py-3">Rol</th>
                <th class="text-left font-medium px-4 py-3">Correo</th>
                <th class="text-left font-medium px-4 py-3">Último acceso</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (u of pg.items; track u.id) {
                <tr class="hover:bg-superficie-2" [class.opacity-50]="!u.activo">
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ u.nombre }}</div>
                    <div class="text-xs text-texto-tenue">{{ u.dni ? 'DNI ' + u.dni : '' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-md bg-marca-soft text-marca">{{ u.rol }}</span>
                  </td>
                  <td class="px-4 py-3 text-texto-tenue">{{ u.email }}</td>
                  <td class="px-4 py-3 text-texto-tenue">{{ u.ultimoAcceso ? (u.ultimoAcceso | date: 'dd/MM/yy HH:mm') : 'nunca' }}</td>
                  <td class="px-4 py-3 text-right">
                    @if (sesion.puede('PERSONAL.EDITAR')) {
                      <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
                      <mat-menu #m="matMenu">
                        <button mat-menu-item (click)="form(u)"><mat-icon>edit</mat-icon> Editar</button>
                        <button mat-menu-item (click)="clave(u)"><mat-icon>key</mat-icon> Reiniciar clave</button>
                        <button mat-menu-item (click)="estado(u)"><mat-icon>{{ u.activo ? 'block' : 'check_circle' }}</mat-icon> {{ u.activo ? 'Desactivar' : 'Activar' }}</button>
                      </mat-menu>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="text-center text-texto-tenue py-10">No hay personal.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} persona(s)</span>
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
export class Personal {
  readonly sesion = inject(SesionService);
  private api = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<PersonalModel> | null>(null);
  readonly sedes = signal<SedeSimple[]>([]);
  readonly rolesLista = Object.entries(ROLES).map(([id, nombre]) => ({ id: Number(id), nombre }));
  buscar = '';
  rolId = 0;
  private pag = 1;

  constructor() {
    this.api.sedes().subscribe((s) => this.sedes.set(s));
    this.cargar();
  }
  recargar() { this.pag = 1; this.cargar(); }
  ir(p: number) { this.pag = p; this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    this.api.personal({ pagina: this.pag, tamano: 15, buscar: this.buscar || undefined, rolId: this.rolId || undefined })
      .subscribe({ next: (pg) => { this.pagina.set(pg); this.cargando.set(false); }, error: () => this.cargando.set(false) });
  }
  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.cargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  form(u?: PersonalModel) {
    const campos: CampoAccion[] = [
      { clave: 'nombres', label: 'Nombres', tipo: 'texto', requerido: true, valor: u ? u.nombre.split(' ').slice(0, 1).join(' ') : '', grupo: 'Identidad' },
      { clave: 'apellidos', label: 'Apellidos', tipo: 'texto', requerido: true, valor: u ? u.nombre.split(' ').slice(1).join(' ') : '' },
      { clave: 'dni', label: 'DNI', tipo: 'texto', valor: u?.dni ?? '' },
      { clave: 'telefono', label: 'Teléfono', tipo: 'texto', valor: u?.telefono ?? '' },
      ...(u ? [] : [{ clave: 'email', label: 'Correo', tipo: 'texto' as const, requerido: true, placeholder: 'correo@dominio.pe', col: 'full' as const }]),
      { clave: 'rolId', label: 'Rol', tipo: 'select', requerido: true, valor: u?.rolId ?? 6, grupo: 'Acceso', opciones: this.rolesLista.map((r) => ({ valor: r.id, texto: r.nombre })) },
      { clave: 'sedeId', label: 'Sede', tipo: 'select', valor: u?.sedeId ?? '', opciones: [{ valor: '', texto: 'Sin sede' }, ...this.sedes().map((s) => ({ valor: s.id, texto: s.nombre }))] },
    ];
    this.dialog.open(AccionDialog, { width: '560px', maxWidth: '95vw',
      data: { titulo: u ? 'Editar persona' : 'Nueva persona', icono: 'badge', confirmar: 'Guardar', campos } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        if (v.sedeId === '') v.sedeId = null as unknown as string;
        if (u) {
          this.api.editarPersonal(u.id, v).subscribe({ next: () => this.ok('Guardado.'), error: (e) => this.err(e) });
        } else {
          this.api.crearPersonal(v).subscribe({
            next: (r) => {
              this.dialog.open(ClaveDialog, { width: '440px', data: { titulo: 'Persona creada', email: v['email'] as string, clave: r.claveTemporal } });
              this.ok('Guardado.');
            },
            error: (e) => this.err(e),
          });
        }
      });
  }

  clave(u: PersonalModel) {
    this.api.clavePersonal(u.id).subscribe({
      next: (r) => this.dialog.open(ClaveDialog, { width: '440px', data: { titulo: 'Clave temporal nueva', email: u.email, clave: r.claveTemporal } }),
      error: (e) => this.err(e),
    });
  }

  estado(u: PersonalModel) {
    this.api.estadoPersonal(u.id, !u.activo).subscribe({ next: () => this.ok(u.activo ? 'Desactivado.' : 'Activado.'), error: (e) => this.err(e) });
  }
}
