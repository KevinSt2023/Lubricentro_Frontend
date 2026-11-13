import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaestrosService } from './maestros.service';
import { Servicio } from './maestros.models';
import { Pagina, ErrorApi } from '../../core/modelos';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-servicios',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Servicios</h1>
        <p class="text-texto-tenue text-sm">El catálogo del taller.</p>
      </div>
      @if (sesion.puede('SERVICIOS.EDITAR')) {
        <button mat-flat-button color="primary" (click)="form()"><mat-icon>add</mat-icon> Nuevo servicio</button>
      }
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <div class="relative w-72">
        <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue !text-xl pointer-events-none">search</mat-icon>
        <input class="lt-input !pl-10" placeholder="Nombre o código" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
      </div>
    </div>

    <div class="rounded-2xl border border-borde bg-superficie overflow-hidden">
      @if (cargando()) {
        <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
      } @else if (pagina(); as pg) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-texto-tenue text-xs uppercase border-b border-borde bg-superficie-2">
              <tr>
                <th class="text-left font-medium px-4 py-3">Código</th>
                <th class="text-left font-medium px-4 py-3">Servicio</th>
                <th class="text-left font-medium px-4 py-3">Categoría</th>
                <th class="text-right font-medium px-4 py-3">Precio</th>
                <th class="text-right font-medium px-4 py-3">Duración</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (s of pg.items; track s.id) {
                <tr class="hover:bg-superficie-2" [class.opacity-50]="!s.activo">
                  <td class="px-4 py-3 font-mono text-texto-tenue">{{ s.codigo }}</td>
                  <td class="px-4 py-3 font-medium">{{ s.nombre }}</td>
                  <td class="px-4 py-3 text-texto-tenue">{{ s.categoria || '—' }}</td>
                  <td class="px-4 py-3 text-right">S/ {{ s.precio | number: '1.2-2' }}</td>
                  <td class="px-4 py-3 text-right text-texto-tenue">{{ s.duracionMin ? s.duracionMin + ' min' : '—' }}</td>
                  <td class="px-4 py-3 text-right">
                    @if (sesion.puede('SERVICIOS.EDITAR')) {
                      <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
                      <mat-menu #m="matMenu">
                        <button mat-menu-item (click)="form(s)"><mat-icon>edit</mat-icon> Editar</button>
                        <button mat-menu-item (click)="estado(s)"><mat-icon>{{ s.activo ? 'block' : 'check_circle' }}</mat-icon> {{ s.activo ? 'Desactivar' : 'Activar' }}</button>
                      </mat-menu>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="text-center text-texto-tenue py-10">No hay servicios.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} servicio(s)</span>
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
export class Servicios {
  readonly sesion = inject(SesionService);
  private api = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<Servicio> | null>(null);
  buscar = '';
  private pag = 1;

  constructor() { this.cargar(); }
  recargar() { this.pag = 1; this.cargar(); }
  ir(p: number) { this.pag = p; this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    this.api.servicios({ pagina: this.pag, tamano: 15, buscar: this.buscar || undefined })
      .subscribe({ next: (pg) => { this.pagina.set(pg); this.cargando.set(false); }, error: () => this.cargando.set(false) });
  }
  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.cargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  form(s?: Servicio) {
    const campos: CampoAccion[] = [
      { clave: 'codigo', label: 'Código', tipo: 'texto', requerido: true, valor: s?.codigo ?? '', placeholder: 'SRV-001' },
      { clave: 'categoria', label: 'Categoría', tipo: 'texto', valor: s?.categoria ?? '', placeholder: 'Lubricación, frenos…' },
      { clave: 'nombre', label: 'Nombre del servicio', tipo: 'texto', requerido: true, valor: s?.nombre ?? '', col: 'full' },
      { clave: 'precio', label: 'Precio', tipo: 'numero', requerido: true, valor: s?.precio ?? 0, prefijo: 'S/', min: 0, step: 0.5 },
      { clave: 'duracionMin', label: 'Duración', tipo: 'numero', valor: s?.duracionMin ?? '', min: 0, hint: 'En minutos' },
    ];
    this.dialog.open(AccionDialog, { width: '480px', maxWidth: '95vw',
      data: { titulo: s ? 'Editar servicio' : 'Nuevo servicio', icono: 'handyman', confirmar: 'Guardar', campos } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        const obs = s ? this.api.editarServicio(s.id, v) : this.api.crearServicio(v);
        obs.subscribe({ next: () => this.ok('Servicio guardado.'), error: (e) => this.err(e) });
      });
  }

  estado(s: Servicio) {
    this.api.estadoServicio(s.id, !s.activo).subscribe({ next: () => this.ok(s.activo ? 'Desactivado.' : 'Activado.'), error: (e) => this.err(e) });
  }
}
