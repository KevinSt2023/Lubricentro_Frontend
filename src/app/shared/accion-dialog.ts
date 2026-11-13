import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Buscador, OpcionBuscar } from './buscador';

export interface CampoAccion {
  clave: string;
  label: string;
  tipo: 'texto' | 'numero' | 'area' | 'select' | 'buscar' | 'fecha' | 'combo';
  opciones?: { valor: string | number; texto: string }[];
  valor?: string | number;
  requerido?: boolean;
  hint?: string;
  placeholder?: string;
  /** Ancho en la rejilla: 'half' (por defecto en campos cortos) o 'full'. */
  col?: 'half' | 'full';
  /** Encabezado de sección: se dibuja antes de este campo. */
  grupo?: string;
  min?: number;
  max?: number;
  step?: number;
  prefijo?: string;
  /** Para tipo 'buscar': función que devuelve opciones desde el backend. */
  buscar?: (q: string) => Observable<OpcionBuscar[]>;
  /** Para tipo 'buscar': callback opcional al elegir (p.ej. autollenar otro campo). */
  alElegir?: (o: OpcionBuscar | null) => void;
}

export interface AccionData {
  titulo: string;
  mensaje?: string;
  confirmar: string;
  icono?: string;
  peligro?: boolean;
  campos: CampoAccion[];
}

/**
 * Diálogo genérico de formulario: cabecera + campos en rejilla + confirmar.
 * Los campos cortos se acomodan de a dos por fila en pantallas anchas y de a
 * uno en móvil; las áreas, buscadores y campos marcados 'full' ocupan la fila.
 */
@Component({
  selector: 'lt-accion-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatButtonModule, MatIconModule, Buscador,
  ],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2.5 !mb-0 !pb-1">
      @if (data.icono) {
        <span class="grid place-items-center w-9 h-9 rounded-xl shrink-0"
              [class]="data.peligro ? 'bg-marca-soft text-marca' : 'bg-marca-soft text-marca'">
          <mat-icon class="!text-xl">{{ data.icono }}</mat-icon>
        </span>
      }
      <span class="text-lg font-semibold leading-tight">{{ data.titulo }}</span>
    </h2>

    <mat-dialog-content class="!max-h-[70vh] lt-contenedor">
      @if (data.mensaje) {
        <p class="text-texto-tenue text-sm mb-4 -mt-1">{{ data.mensaje }}</p>
      }
      <form class="lt-grid pt-2">
        @for (c of data.campos; track c.clave) {
          @if (c.grupo) {
            <div class="lt-full mt-2 mb-1 first:mt-0">
              <span class="text-xs font-semibold uppercase tracking-wide text-texto-tenue">{{ c.grupo }}</span>
              <div class="h-px bg-borde mt-1.5"></div>
            </div>
          }

          <div [class]="ancho(c)">
            @if (c.tipo === 'buscar') {
              <lt-buscador [label]="etiqueta(c)" [buscar]="c.buscar!" [placeholder]="c.placeholder ?? 'Escribe para buscar…'"
                           (seleccionado)="elegido(c, $event)" />
            } @else {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <mat-label>{{ etiqueta(c) }}</mat-label>
                @if (c.prefijo) { <span matPrefix class="text-texto-tenue pl-3">{{ c.prefijo }}</span> }
                @switch (c.tipo) {
                  @case ('select') {
                    <mat-select [(ngModel)]="valores[c.clave]" [name]="c.clave">
                      @for (o of c.opciones; track o.valor) {
                        <mat-option [value]="o.valor">{{ o.texto }}</mat-option>
                      }
                    </mat-select>
                  }
                  @case ('combo') {
                    <input matInput [(ngModel)]="valores[c.clave]" [name]="c.clave"
                           [matAutocomplete]="auto" [placeholder]="c.placeholder ?? ''" />
                    <mat-autocomplete #auto="matAutocomplete">
                      @for (o of filtrar(c); track o.valor) {
                        <mat-option [value]="o.texto">{{ o.texto }}</mat-option>
                      }
                    </mat-autocomplete>
                  }
                  @case ('area') {
                    <textarea matInput rows="3" [(ngModel)]="valores[c.clave]" [name]="c.clave"
                              [placeholder]="c.placeholder ?? ''"></textarea>
                  }
                  @case ('numero') {
                    <input matInput type="number" [(ngModel)]="valores[c.clave]" [name]="c.clave"
                           [min]="c.min ?? null" [max]="c.max ?? null" [step]="c.step ?? null"
                           [placeholder]="c.placeholder ?? ''" />
                  }
                  @case ('fecha') {
                    <input matInput type="date" [(ngModel)]="valores[c.clave]" [name]="c.clave" />
                  }
                  @default {
                    <input matInput [(ngModel)]="valores[c.clave]" [name]="c.clave" [placeholder]="c.placeholder ?? ''" />
                  }
                }
                @if (c.hint) { <mat-hint>{{ c.hint }}</mat-hint> }
              </mat-form-field>
            }
          </div>
        }
      </form>

      @if (error()) {
        <div class="flex items-center gap-2 text-marca text-sm mt-1 rounded-lg bg-marca-soft px-3 py-2">
          <mat-icon class="!text-base">error_outline</mat-icon> {{ error() }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-5 !pt-2 gap-1">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [color]="data.peligro ? 'warn' : 'primary'" (click)="confirmar()">
        @if (data.peligro) { <mat-icon>warning</mat-icon> }
        {{ data.confirmar }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .lt-contenedor { container-type: inline-size; container-name: lt-dialog; }
    .lt-grid { display: grid; grid-template-columns: 1fr; column-gap: 1rem; row-gap: 0.25rem; }
    .lt-full { grid-column: 1 / -1; }
    @container lt-dialog (min-width: 440px) {
      .lt-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class AccionDialog {
  readonly data = inject<AccionData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<AccionDialog>);
  readonly error = signal<string | null>(null);

  valores: Record<string, string | number> = {};

  constructor() {
    for (const c of this.data.campos) this.valores[c.clave] = c.valor ?? '';
  }

  /** Etiqueta con asterisco cuando el campo es obligatorio. */
  etiqueta(c: CampoAccion): string {
    return c.requerido ? `${c.label} *` : c.label;
  }

  /** Ancho en la rejilla: las áreas y buscadores ocupan toda la fila; el resto media. */
  ancho(c: CampoAccion): string {
    const full = c.col === 'full' || c.tipo === 'area' || c.tipo === 'buscar'
      || (c.col !== 'half' && this.data.campos.length === 1);
    return full ? 'lt-full' : '';
  }

  filtrar(c: CampoAccion): { valor: string | number; texto: string }[] {
    const v = String(this.valores[c.clave] ?? '').toLowerCase().trim();
    const ops = c.opciones ?? [];
    if (!v) return ops;
    return ops.filter((o) => o.texto.toLowerCase().includes(v));
  }

  elegido(c: CampoAccion, o: OpcionBuscar | null): void {
    this.valores[c.clave] = o ? o.valor : '';
    c.alElegir?.(o);
  }

  confirmar(): void {
    const falta = this.data.campos.find(
      (c) => c.requerido && (this.valores[c.clave] === '' || this.valores[c.clave] == null),
    );
    if (falta) {
      this.error.set(`Completa el campo obligatorio: ${falta.label}.`);
      return;
    }
    this.ref.close(this.valores);
  }
}
