import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaestrosService } from '../maestros/maestros.service';
import { SedeSimple } from '../maestros/maestros.models';
import { Buscador, OpcionBuscar } from '../../shared/buscador';

/** Alta de una orden: se busca el vehículo y el cliente sale solo. */
@Component({
  selector: 'lt-nueva-orden-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, Buscador],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2.5 !mb-0 !pb-1">
      <span class="grid place-items-center w-9 h-9 rounded-xl bg-marca-soft text-marca shrink-0">
        <mat-icon class="!text-xl">build</mat-icon>
      </span>
      <span class="text-lg font-semibold">Nueva orden</span>
    </h2>
    <mat-dialog-content class="!min-w-[min(460px,92vw)] !max-h-[72vh]">
      <div class="pt-2 flex flex-col gap-3">
        <lt-buscador label="Vehículo (placa, marca o modelo)"
                     placeholder="Escribe la placa…" [buscar]="buscarVehiculo"
                     (seleccionado)="elegirVehiculo($event)" />

        @if (clienteNombre()) {
          <div class="-mt-1 flex items-center gap-2 text-sm text-texto-tenue">
            <mat-icon class="!text-base">person</mat-icon> Cliente: <b class="text-texto">{{ clienteNombre() }}</b>
          </div>
        }

        <div>
          <label class="lt-label">Sede</label>
          <select class="lt-input" [(ngModel)]="sedeId">
            @for (s of sedes(); track s.id) { <option [ngValue]="s.id">{{ s.nombre }}</option> }
          </select>
        </div>

        <div>
          <label class="lt-label">Estado inicial</label>
          <select class="lt-input" [(ngModel)]="estadoInicial">
            <option value="RECIBIDO">Recibido (ingreso directo)</option>
            <option value="CITA_REGISTRADA">Cita registrada</option>
          </select>
        </div>

        <div>
          <label class="lt-label">Kilometraje de ingreso</label>
          <input class="lt-input" type="number" min="0" [(ngModel)]="kilometrajeIngreso" />
        </div>

        <div>
          <label class="lt-label">Observaciones</label>
          <textarea class="lt-input" rows="2" [(ngModel)]="observaciones"></textarea>
        </div>

        @if (error()) {
          <div class="flex items-center gap-2 text-marca text-sm rounded-lg bg-marca-soft px-3 py-2">
            <mat-icon class="!text-base">error_outline</mat-icon> {{ error() }}
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-5 !pt-2 gap-1">
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
      sedeId: Number(this.sedeId),
      estadoInicial: this.estadoInicial,
      kilometrajeIngreso: this.kilometrajeIngreso || undefined,
      observaciones: this.observaciones || undefined,
    });
  }
}
