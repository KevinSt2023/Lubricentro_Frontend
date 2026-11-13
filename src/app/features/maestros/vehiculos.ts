import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaestrosService } from './maestros.service';
import { Vehiculo, TIPOS_VEHICULO, MARCAS_VEHICULO, COLORES_VEHICULO, aniosVehiculo, modelosDe } from './maestros.models';
import { Pagina, ErrorApi } from '../../core/modelos';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { OpcionBuscar } from '../../shared/buscador';
import { map } from 'rxjs';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-vehiculos',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Vehículos</h1>
        <p class="text-texto-tenue text-sm">Placas, modelos y kilometraje.</p>
      </div>
      @if (sesion.puede('VEHICULOS.CREAR')) {
        <button mat-flat-button color="primary" (click)="form()"><mat-icon>add</mat-icon> Nuevo vehículo</button>
      }
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <div class="relative w-72">
        <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue !text-xl pointer-events-none">search</mat-icon>
        <input class="lt-input !pl-10" placeholder="Placa, marca o modelo" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
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
                <th class="text-left font-medium px-4 py-3">Placa</th>
                <th class="text-left font-medium px-4 py-3">Vehículo</th>
                <th class="text-left font-medium px-4 py-3">Cliente</th>
                <th class="text-right font-medium px-4 py-3">Kilometraje</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (v of pg.items; track v.id) {
                <tr class="hover:bg-superficie-2" [class.opacity-50]="!v.activo">
                  <td class="px-4 py-3">
                    <span class="font-mono font-semibold tracking-wide px-2 py-0.5 rounded border border-borde bg-superficie-2">{{ v.placa }}</span>
                  </td>
                  <td class="px-4 py-3">{{ v.marca }} {{ v.modelo }} <span class="text-texto-tenue">{{ v.anio || '' }}</span></td>
                  <td class="px-4 py-3 text-texto-tenue">{{ v.cliente || '—' }}</td>
                  <td class="px-4 py-3 text-right">{{ v.kilometraje | number }} km</td>
                  <td class="px-4 py-3 text-right">
                    <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
                    <mat-menu #m="matMenu">
                      @if (sesion.puede('VEHICULOS.EDITAR')) {
                        <button mat-menu-item (click)="km(v)"><mat-icon>speed</mat-icon> Registrar kilometraje</button>
                        <button mat-menu-item (click)="form(v)"><mat-icon>edit</mat-icon> Editar</button>
                        <button mat-menu-item (click)="estado(v)"><mat-icon>{{ v.activo ? 'block' : 'check_circle' }}</mat-icon> {{ v.activo ? 'Desactivar' : 'Activar' }}</button>
                      }
                    </mat-menu>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="text-center text-texto-tenue py-10">No hay vehículos.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} vehículo(s)</span>
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
export class Vehiculos {
  readonly sesion = inject(SesionService);
  private api = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<Vehiculo> | null>(null);
  buscar = '';
  private pag = 1;

  constructor() { this.cargar(); }
  recargar() { this.pag = 1; this.cargar(); }
  ir(p: number) { this.pag = p; this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    this.api.vehiculos({ pagina: this.pag, tamano: 15, buscar: this.buscar || undefined })
      .subscribe({ next: (pg) => { this.pagina.set(pg); this.cargando.set(false); }, error: () => this.cargando.set(false) });
  }
  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.cargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  private buscarCliente = (q: string) =>
    this.api.clientes({ buscar: q, tamano: 10, activo: true }).pipe(
      map((pg) => pg.items.map((c): OpcionBuscar => ({ valor: c.id, texto: c.nombre, sub: c.documento ?? '' }))),
    );

  form(v?: Vehiculo) {
    const campos: CampoAccion[] = [
      v
        ? { clave: 'clienteId', label: 'Cliente (ID)', tipo: 'numero', requerido: true, valor: v.clienteId, grupo: 'Propietario', col: 'full' }
        : { clave: 'clienteId', label: 'Cliente', tipo: 'buscar', requerido: true, buscar: this.buscarCliente, grupo: 'Propietario' },
      { clave: 'placa', label: 'Placa', tipo: 'texto', requerido: true, valor: v?.placa ?? '', grupo: 'Vehículo', placeholder: 'ABC-123' },
      { clave: 'tipo', label: 'Tipo', tipo: 'select', valor: v?.tipo ?? 'AUTO', opciones: TIPOS_VEHICULO.map((t) => ({ valor: t, texto: t })) },
      { clave: 'marca', label: 'Marca', tipo: 'combo', requerido: true, valor: v?.marca ?? '', opciones: MARCAS_VEHICULO.map((m) => ({ valor: m, texto: m })), placeholder: 'Toyota, Kia…' },
      { clave: 'modelo', label: 'Modelo', tipo: 'combo', requerido: true, valor: v?.modelo ?? '', placeholder: 'Elige la marca primero',
        opcionesDe: (val) => modelosDe(val['marca']).map((m) => ({ valor: m, texto: m })) },
      { clave: 'anio', label: 'Año', tipo: 'select', valor: v?.anio ?? '', opciones: aniosVehiculo().map((a) => ({ valor: a, texto: String(a) })) },
      { clave: 'color', label: 'Color', tipo: 'combo', valor: v?.color ?? '', opciones: COLORES_VEHICULO.map((c) => ({ valor: c, texto: c })) },
      { clave: 'kilometraje', label: 'Kilometraje', tipo: 'numero', valor: v?.kilometraje ?? 0, min: 0, hint: 'En kilómetros', grupo: 'Estado' },
    ];
    this.dialog.open(AccionDialog, { width: '560px', maxWidth: '95vw',
      data: { titulo: v ? 'Editar vehículo' : 'Nuevo vehículo', icono: 'directions_car', confirmar: 'Guardar', campos } })
      .afterClosed().subscribe((val) => {
        if (!val) return;
        const obs = v ? this.api.editarVehiculo(v.id, val) : this.api.crearVehiculo(val);
        obs.subscribe({ next: () => this.ok('Vehículo guardado.'), error: (e) => this.err(e) });
      });
  }

  km(v: Vehiculo) {
    this.dialog.open(AccionDialog, { width: '380px',
      data: { titulo: 'Registrar kilometraje', mensaje: `${v.placa} · actual ${v.kilometraje.toLocaleString()} km. El kilometraje solo sube.`,
        confirmar: 'Registrar', campos: [{ clave: 'kilometraje', label: 'Nuevo kilometraje', tipo: 'numero', requerido: true, valor: v.kilometraje }] } })
      .afterClosed().subscribe((val) => {
        if (!val) return;
        this.api.kilometraje(v.id, Number(val.kilometraje)).subscribe({ next: () => this.ok('Kilometraje actualizado.'), error: (e) => this.err(e) });
      });
  }

  estado(v: Vehiculo) {
    this.api.estadoVehiculo(v.id, !v.activo).subscribe({ next: () => this.ok(v.activo ? 'Desactivado.' : 'Activado.'), error: (e) => this.err(e) });
  }
}
