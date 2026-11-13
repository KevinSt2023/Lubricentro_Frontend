import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaestrosService } from '../maestros/maestros.service';
import { SedeSimple } from '../maestros/maestros.models';
import { Buscador, OpcionBuscar } from '../../shared/buscador';

/** Alta de una orden: se busca el vehículo y el cliente sale solo. */
@Component({
  selector: 'lt-nueva-orden-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, Buscador,
  ],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2">
      <mat-icon class="text-marca">build</mat-icon> Nueva orden
    </h2>
    <mat-dialog-content class="!min-w-[min(460px,92vw)]">
      <div class="pt-1">
        <lt-buscador label="Vehículo (placa, marca o modelo)"
                     placeholder="Escribe la placa…" [buscar]="buscarVehiculo"
                     (seleccionado)="elegirVehiculo($event)" />

        @if (clienteNombre()) {
          <div class="-mt-2 mb-3 flex items-center gap-2 text-sm text-texto-tenue">
            <mat-icon class="!text-base">person</mat-icon> Cliente: <b class="text-texto">{{ clienteNombre() }}</b>
          </div>
        }

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Sede</mat-label>
          <mat-select [(ngModel)]="sedeId">
            @for (s of sedes(); track s.id) { <mat-option [value]="s.id">{{ s.nombre }}</mat-option> }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Estado inicial</mat-label>
          <mat-select [(ngModel)]="estadoInicial">
            <mat-option value="RECIBIDO">Recibido (ingreso directo)</mat-option>
            <mat-option value="CITA_REGISTRADA">Cita registrada</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Kilometraje de ingreso</mat-label>
          <input matInput type="number" [(ngModel)]="kilometrajeIngreso" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Observaciones</mat-label>
          <textarea matInput rows="2" [(ngModel)]="observaciones"></textarea>
        </mat-form-field>

        @if (error()) { <div class="text-marca text-sm">{{ error() }}</div> }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()">Abrir orden</button>
    </mat-dialog-actions>
  `,
})
export class NuevaOrdenDialog {
  private maestros = inject(MaestrosService);
  private ref = inject(MatDialogRef<NuevaOrdenDialog>);

  readonly sedes = signal<SedeSimple[]>([]);
  readonly clienteNombre = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  private vehiculoId: number | null = null;
  private clienteId: number | null = null;
  sedeId: number | null = null;
  estadoInicial = 'RECIBIDO';
  kilometrajeIngreso: number | null = null;
  observaciones = '';

  // Cache de la última búsqueda para recuperar el cliente del vehículo elegido.
  private cache = new Map<number, { clienteId: number; cliente: string }>();

  constructor() {
    this.maestros.sedes().subscribe((s) => {
      const activas = s.filter((x) => x.activo);
      this.sedes.set(activas);
      this.sedeId = activas[0]?.id ?? null;
    });
  }

  buscarVehiculo = (q: string) =>
    this.maestros.vehiculos({ buscar: q, tamano: 10, activo: true }).pipe(
      map((pg) => {
        this.cache.clear();
        return pg.items.map((v): OpcionBuscar => {
          this.cache.set(v.id, { clienteId: v.clienteId, cliente: v.cliente ?? '' });
          return { valor: v.id, texto: v.placa, sub: `${v.marca} ${v.modelo} · ${v.cliente ?? ''}` };
        });
      }),
    );

  elegirVehiculo(o: OpcionBuscar | null) {
    if (!o) { this.vehiculoId = null; this.clienteId = null; this.clienteNombre.set(null); return; }
    this.vehiculoId = o.valor;
    const info = this.cache.get(o.valor);
    this.clienteId = info?.clienteId ?? null;
    this.clienteNombre.set(info?.cliente ?? null);
  }

  confirmar() {
    if (!this.vehiculoId || !this.clienteId) { this.error.set('Busca y elige un vehículo.'); return; }
    if (!this.sedeId) { this.error.set('Elige una sede.'); return; }
    this.ref.close({
      clienteId: this.clienteId,
      vehiculoId: this.vehiculoId,
      sedeId: this.sedeId,
      estadoInicial: this.estadoInicial,
      kilometrajeIngreso: this.kilometrajeIngreso || undefined,
      observaciones: this.observaciones || undefined,
    });
  }
}
