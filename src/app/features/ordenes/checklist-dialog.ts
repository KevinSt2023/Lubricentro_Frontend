import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrdenesService } from './ordenes.service';
import { ChecklistRespuesta } from './ordenes.models';

interface Fila {
  item: string;
  resultado: 'OK' | 'OBSERVADO' | 'MALO' | 'NA';
  nota: string;
}

export interface ChecklistData {
  respuestas: ChecklistRespuesta[];
}

/** Editor del checklist de inspección de una orden. */
@Component({
  selector: 'lt-checklist-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatButtonToggleModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Checklist de inspección</h2>
    <mat-dialog-content class="!min-w-[min(560px,92vw)]">
      @if (cargando()) {
        <div class="grid place-items-center py-8"><mat-spinner diameter="30" /></div>
      } @else {
        <div class="flex flex-col gap-3 pt-1">
          @for (f of filas(); track f.item; let i = $index) {
            <div class="rounded-xl border border-borde p-3">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-medium text-sm">{{ f.item }}</span>
                <mat-button-toggle-group [(ngModel)]="f.resultado" class="!h-8">
                  <mat-button-toggle value="OK" class="!text-xs">OK</mat-button-toggle>
                  <mat-button-toggle value="OBSERVADO" class="!text-xs">Obs.</mat-button-toggle>
                  <mat-button-toggle value="MALO" class="!text-xs">Malo</mat-button-toggle>
                  <mat-button-toggle value="NA" class="!text-xs">N/A</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
              @if (f.resultado === 'OBSERVADO' || f.resultado === 'MALO') {
                <input [(ngModel)]="f.nota" placeholder="Nota (opcional)"
                       class="mt-2 w-full bg-transparent border-b border-borde text-sm py-1 outline-none" />
              }
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="cargando()">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class ChecklistDialog {
  readonly data = inject<ChecklistData>(MAT_DIALOG_DATA);
  private api = inject(OrdenesService);
  private ref = inject(MatDialogRef<ChecklistDialog, Fila[]>);

  readonly cargando = signal(true);
  readonly filas = signal<Fila[]>([]);

  constructor() {
    this.api.plantilla().subscribe({
      next: (plantilla) => {
        const previas = new Map(this.data.respuestas.map((r) => [r.item, r]));
        const filas: Fila[] = plantilla.map((p) => {
          const prev = previas.get(p.nombre);
          return { item: p.nombre, resultado: prev?.resultado ?? 'OK', nota: prev?.nota ?? '' };
        });
        // Conserva respuestas de puntos que ya no están en la plantilla.
        for (const r of this.data.respuestas) if (!filas.some((f) => f.item === r.item)) filas.push({ item: r.item, resultado: r.resultado, nota: r.nota ?? '' });
        this.filas.set(filas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  guardar() {
    this.ref.close(this.filas());
  }
}
