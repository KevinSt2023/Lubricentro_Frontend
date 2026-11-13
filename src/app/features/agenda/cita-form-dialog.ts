import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaestrosService } from '../maestros/maestros.service';
import { Personal, SedeSimple } from '../maestros/maestros.models';
import { Buscador, OpcionBuscar } from '../../shared/buscador';
import { AgendaCita } from './agenda.models';

export interface CitaDialogData {
  modo: 'crear' | 'reprogramar';
  /** En 'crear': día preseleccionado (yyyy-mm-dd). En 'reprogramar': la cita. */
  fecha?: string;
  sedeId?: number;
  cita?: AgendaCita;
  /** En 'crear' desde "próximos mantenimientos": vehículo ya elegido. */
  preVehiculo?: { vehiculoId: number; clienteId: number; placa: string; vehiculo: string; cliente?: string };
}

/**
 * Alta o reprogramación de una cita. En alta se busca el vehículo (el cliente
 * sale solo) y se fija fecha, hora, sede y técnico. Inputs de marca, sin Material.
 */
@Component({
  selector: 'lt-cita-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, Buscador],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2.5 !mb-0 !pb-1">
      <span class="grid place-items-center w-9 h-9 rounded-xl bg-marca-soft text-marca shrink-0">
        <mat-icon class="!text-xl">event</mat-icon>
      </span>
      <span class="text-lg font-semibold leading-tight">{{ esReprogramar ? 'Reprogramar cita' : 'Nueva cita' }}</span>
    </h2>

    <mat-dialog-content class="!min-w-[min(480px,92vw)] !max-h-[74vh] lt-contenedor">
      <form class="lt-grid pt-2">
        @if (esReprogramar || tienePre) {
          <div class="lt-full rounded-xl border border-borde bg-superficie-2 px-3 py-2.5">
            <div class="font-mono text-xs text-texto-tenue">{{ cab.numero ? '#' + cab.numero + ' · ' : '' }}{{ cab.placa }}</div>
            <div class="font-medium">{{ cab.vehiculo }}</div>
            <div class="text-sm text-texto-tenue">{{ cab.cliente }}</div>
          </div>
        } @else {
          <div class="lt-full">
            <lt-buscador label="Vehículo (placa, marca o modelo) *"
                         placeholder="Escribe la placa…" [buscar]="buscarVehiculo"
                         (seleccionado)="elegirVehiculo($event)" />
            @if (clienteNombre()) {
              <div class="mt-1.5 flex items-center gap-1.5 text-sm text-texto-tenue">
                <mat-icon class="!text-base">person</mat-icon> Cliente: <b class="text-texto">{{ clienteNombre() }}</b>
              </div>
            }
          </div>
        }

        <div class="lt-full"><div class="lt-seccion mt-1">Fecha y hora</div></div>
        <div>
          <label class="lt-label">Día *</label>
          <input class="lt-input" type="date" [(ngModel)]="fecha" name="fecha" />
        </div>
        <div>
          <label class="lt-label">Hora *</label>
          <input class="lt-input" type="time" step="300" [(ngModel)]="hora" name="hora" />
        </div>

        <div class="lt-full"><div class="lt-seccion mt-1">Asignación</div></div>
        @if (!esReprogramar) {
          <div>
            <label class="lt-label">Sede *</label>
            <select class="lt-input" [(ngModel)]="sedeId" name="sede">
              @for (s of sedes(); track s.id) { <option [ngValue]="s.id">{{ s.nombre }}</option> }
            </select>
          </div>
        }
        <div [class.lt-full]="esReprogramar">
          <label class="lt-label">Técnico (opcional)</label>
          <select class="lt-input" [(ngModel)]="tecnicoId" name="tecnico">
            <option [ngValue]="null">Sin asignar</option>
            @for (t of tecnicos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
          </select>
        </div>

        @if (!esReprogramar) {
          <div class="lt-full">
            <label class="lt-label">Motivo</label>
            <textarea class="lt-input" rows="2" [(ngModel)]="motivo" name="motivo"
                      placeholder="Cambio de aceite, revisión de frenos…"></textarea>
          </div>
        }
      </form>

      @if (error()) {
        <div class="flex items-center gap-2 text-marca text-sm mt-2 rounded-lg bg-marca-soft px-3 py-2">
          <mat-icon class="!text-base">error_outline</mat-icon> {{ error() }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-5 !pt-2 gap-1">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()">
        {{ esReprogramar ? 'Guardar' : 'Agendar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .lt-contenedor { container-type: inline-size; container-name: lt-dialog; }
    .lt-grid { display: grid; grid-template-columns: 1fr; column-gap: 1rem; row-gap: 0.85rem; align-items: start; }
    .lt-full { grid-column: 1 / -1; }
    @container lt-dialog (min-width: 440px) { .lt-grid { grid-template-columns: 1fr 1fr; } }
  `],
})
export class CitaFormDialog {
  readonly data = inject<CitaDialogData>(MAT_DIALOG_DATA);
  private maestros = inject(MaestrosService);
  private ref = inject(MatDialogRef<CitaFormDialog>);

  readonly esReprogramar = this.data.modo === 'reprogramar';
  readonly tienePre = this.data.modo === 'crear' && !!this.data.preVehiculo;
  /** Encabezado read-only cuando el vehículo ya está fijado (reprogramar o preselección). */
  readonly cab = this.data.cita
    ? { numero: this.data.cita.numero, placa: this.data.cita.placa, vehiculo: this.data.cita.vehiculo, cliente: this.data.cita.cliente }
    : { numero: 0, placa: this.data.preVehiculo?.placa, vehiculo: this.data.preVehiculo?.vehiculo, cliente: this.data.preVehiculo?.cliente };
  readonly sedes = signal<SedeSimple[]>([]);
  readonly tecnicos = signal<Personal[]>([]);
  readonly clienteNombre = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  private vehiculoId: number | null = null;
  private clienteId: number | null = null;
  sedeId: number | null = null;
  tecnicoId: number | null = null;
  fecha = '';
  hora = '09:00';
  motivo = '';

  private cache = new Map<number, { clienteId: number; cliente: string }>();

  constructor() {
    this.maestros.sedes().subscribe((s) => {
      const activas = s.filter((x) => x.activo);
      this.sedes.set(activas);
      this.sedeId = this.data.sedeId ?? activas[0]?.id ?? null;
    });
    this.maestros.personal({ rolId: 6, activo: true, tamano: 100 })
      .subscribe((pg) => this.tecnicos.set(pg.items));

    if (this.esReprogramar && this.data.cita) {
      const d = new Date(this.data.cita.fechaCita);
      this.fecha = this.diaLima(d);
      this.hora = this.horaLima(d);
      this.tecnicoId = this.data.cita.tecnicoId ?? null;
    } else {
      this.fecha = this.data.fecha ?? this.diaLima(new Date());
    }
  }

  // --- Eje de tiempo: se muestra y se arma en hora de Lima (-05:00) ---
  private aLima(d: Date): Date { return new Date(d.getTime() - 5 * 3600 * 1000); }
  private diaLima(d: Date): string { return this.aLima(d).toISOString().slice(0, 10); }
  private horaLima(d: Date): string { return this.aLima(d).toISOString().slice(11, 16); }

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
    if (!this.fecha || !this.hora) { this.error.set('Indica el día y la hora.'); return; }
    const fechaCita = `${this.fecha}T${this.hora}:00-05:00`;

    if (this.esReprogramar) {
      this.ref.close({ fechaCita, tecnicoId: this.tecnicoId ?? undefined });
      return;
    }

    const vehId = this.tienePre ? this.data.preVehiculo!.vehiculoId : this.vehiculoId;
    const cliId = this.tienePre ? this.data.preVehiculo!.clienteId : this.clienteId;
    if (!vehId || !cliId) { this.error.set('Busca y elige un vehículo.'); return; }
    if (!this.sedeId) { this.error.set('Elige una sede.'); return; }
    this.ref.close({
      clienteId: cliId,
      vehiculoId: vehId,
      sedeId: Number(this.sedeId),
      fechaCita,
      tecnicoId: this.tecnicoId ?? undefined,
      motivo: this.motivo || undefined,
    });
  }
}
