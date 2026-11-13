import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaestrosService } from './maestros.service';
import { Vehiculo } from './maestros.models';

export interface VehiculosDeData {
  clienteId: number;
  nombre: string;
}

/** Lista de solo lectura de los vehículos de un cliente. */
@Component({
  selector: 'lt-vehiculos-de-dialog',
  standalone: true,
  imports: [DecimalPipe, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2">
      <mat-icon class="text-marca">directions_car</mat-icon> Vehículos de {{ data.nombre }}
    </h2>
    <mat-dialog-content>
      @if (cargando()) {
        <div class="grid place-items-center py-8"><mat-spinner diameter="30" /></div>
      } @else if (vehiculos().length) {
        <ul class="divide-y divide-borde">
          @for (v of vehiculos(); track v.id) {
            <li class="py-3 flex items-center justify-between" [class.opacity-50]="!v.activo">
              <div>
                <div class="font-semibold">{{ v.placa }}</div>
                <div class="text-sm text-texto-tenue">{{ v.marca }} {{ v.modelo }} {{ v.anio || '' }}</div>
              </div>
              <div class="text-right text-sm">
                <div class="text-texto-tenue">{{ v.tipo }}</div>
                <div class="font-medium">{{ v.kilometraje | number }} km</div>
              </div>
            </li>
          }
        </ul>
      } @else {
        <p class="text-texto-tenue text-sm py-6 text-center">Este cliente no tiene vehículos registrados.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class VehiculosDeDialog {
  readonly data = inject<VehiculosDeData>(MAT_DIALOG_DATA);
  private api = inject(MaestrosService);
  readonly cargando = signal(true);
  readonly vehiculos = signal<Vehiculo[]>([]);

  constructor() {
    this.api.vehiculos({ clienteId: this.data.clienteId, tamano: 100 }).subscribe({
      next: (pg) => { this.vehiculos.set(pg.items); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
}
