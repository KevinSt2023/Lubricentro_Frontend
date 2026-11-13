import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Buscador, OpcionBuscar } from './buscador';

export interface CampoAccion {
  clave: string;
  label: string;
  tipo: 'texto' | 'numero' | 'area' | 'select' | 'buscar' | 'fecha' | 'combo';
  opciones?: { valor: string | number; texto: string }[];
  /**
   * Opciones dependientes de otros campos (cascada). Si está, manda sobre
   * `opciones`: se recalcula en vivo según los valores actuales del formulario
   * (p. ej. Modelo según la Marca, o Categoría según el Tipo).
   */
  opcionesDe?: (valores: Record<string, string | number>) => { valor: string | number; texto: string }[];
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
 * Inputs propios (estilo de marca, sin Angular Material): caja limpia, label
 * arriba. Los campos cortos van de a dos por fila en diálogos anchos.
 */
@Component({
  selector: 'lt-accion-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, Buscador],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2.5 !mb-0 !pb-1">
      @if (data.icono) {
        <span class="grid place-items-center w-9 h-9 rounded-xl bg-marca-soft text-marca shrink-0">
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
            <div class="lt-full mt-1"><div class="lt-seccion">{{ c.grupo }}</div></div>
          }

          <div [class]="ancho(c)">
            @if (c.tipo === 'buscar') {
              <lt-buscador [label]="etiqueta(c)" [buscar]="c.buscar!"
                           [placeholder]="c.placeholder ?? 'Escribe para buscar…'"
                           (seleccionado)="elegido(c, $event)" />
            } @else {
              <label class="lt-label">{{ etiqueta(c) }}</label>
              @switch (c.tipo) {
                @case ('select') {
                  <select class="lt-input" [(ngModel)]="valores[c.clave]" [name]="c.clave">
                    @for (o of ops(c); track o.valor) {
                      <option [ngValue]="o.valor">{{ o.texto }}</option>
                    }
                  </select>
                }
                @case ('combo') {
                  <input class="lt-input" [(ngModel)]="valores[c.clave]" [name]="c.clave"
                         [attr.list]="'dl-' + c.clave" [placeholder]="c.placeholder ?? ''" autocomplete="off" />
                  <datalist [id]="'dl-' + c.clave">
                    @for (o of ops(c); track o.valor) { <option [value]="o.texto"></option> }
                  </datalist>
                }
                @case ('area') {
                  <textarea class="lt-input" rows="3" [(ngModel)]="valores[c.clave]" [name]="c.clave"
                            [placeholder]="c.placeholder ?? ''"></textarea>
                }
                @case ('numero') {
                  @if (c.prefijo) {
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue text-sm pointer-events-none">{{ c.prefijo }}</span>
                      <input class="lt-input !pl-10" type="number" [(ngModel)]="valores[c.clave]" [name]="c.clave"
                             [min]="c.min ?? null" [max]="c.max ?? null" [step]="c.step ?? null" [placeholder]="c.placeholder ?? ''" />
                    </div>
                  } @else {
                    <input class="lt-input" type="number" [(ngModel)]="valores[c.clave]" [name]="c.clave"
                           [min]="c.min ?? null" [max]="c.max ?? null" [step]="c.step ?? null" [placeholder]="c.placeholder ?? ''" />
                  }
                }
                @case ('fecha') {
                  <input class="lt-input" type="date" [(ngModel)]="valores[c.clave]" [name]="c.clave" />
                }
                @default {
                  <input class="lt-input" [(ngModel)]="valores[c.clave]" [name]="c.clave" [placeholder]="c.placeholder ?? ''" />
                }
              }
              @if (c.hint) { <p class="text-xs text-texto-tenue mt-1">{{ c.hint }}</p> }
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
    /* align-items:start -> un campo con hint no descuadra verticalmente a su par. */
    .lt-grid { display: grid; grid-template-columns: 1fr; column-gap: 1rem; row-gap: 0.85rem; align-items: start; }
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

  etiqueta(c: CampoAccion): string {
    return c.requerido ? `${c.label} *` : c.label;
  }

  /** Opciones a mostrar: dinámicas (cascada) si el campo las define, si no las estáticas. */
  ops(c: CampoAccion): { valor: string | number; texto: string }[] {
    return c.opcionesDe ? c.opcionesDe(this.valores) : (c.opciones ?? []);
  }

  ancho(c: CampoAccion): string {
    const full = c.col === 'full' || c.tipo === 'area' || c.tipo === 'buscar'
      || (c.col !== 'half' && this.data.campos.length === 1);
    return full ? 'lt-full' : '';
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
