import { Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

export interface OpcionBuscar {
  valor: number;
  texto: string;
  sub?: string;
}

/**
 * Buscador con autocompletado. Recibe una función que, dado el texto, devuelve
 * opciones desde el backend (con debounce). Emite el id elegido. Reemplaza los
 * campos de "escribe el ID" por una búsqueda de verdad.
 */
@Component({
  selector: 'lt-buscador',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <input matInput [formControl]="control" [matAutocomplete]="auto"
             [placeholder]="placeholder()" />
      @if (cargando()) { <mat-spinner matSuffix diameter="18" /> }
      @else { <mat-icon matSuffix class="text-texto-tenue">search</mat-icon> }
      <mat-autocomplete #auto="matAutocomplete" [displayWith]="mostrar"
                        (optionSelected)="elegir($event)">
        @for (o of opciones(); track o.valor) {
          <mat-option [value]="o">
            <span class="font-medium">{{ o.texto }}</span>
            @if (o.sub) { <span class="text-texto-tenue text-xs ml-2">{{ o.sub }}</span> }
          </mat-option>
        } @empty {
          @if (control.value && !cargando()) {
            <mat-option [disabled]="true">Sin resultados</mat-option>
          }
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
})
export class Buscador {
  label = input('Buscar');
  placeholder = input('Escribe para buscar…');
  /** Función de búsqueda: texto -> opciones. */
  buscar = input.required<(q: string) => Observable<OpcionBuscar[]>>();

  readonly seleccionado = output<OpcionBuscar | null>();

  readonly control = new FormControl<string | OpcionBuscar>('');
  readonly opciones = signal<OpcionBuscar[]>([]);
  readonly cargando = signal(false);

  constructor() {
    this.control.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((v) => {
          // Si el valor es un objeto, es la opción elegida: no se busca ni se
          // resetea (displayWith ya muestra su texto).
          if (typeof v !== 'string') return [];
          const q = v.trim();
          if (q.length < 2) {
            this.opciones.set([]);
            this.seleccionado.emit(null);
            return [];
          }
          this.cargando.set(true);
          return this.buscar()(q);
        }),
      )
      .subscribe({
        next: (opts) => { this.opciones.set(opts); this.cargando.set(false); },
        error: () => { this.opciones.set([]); this.cargando.set(false); },
      });
  }

  mostrar = (o: OpcionBuscar | string | null): string =>
    o && typeof o === 'object' ? o.texto : '';

  elegir(ev: MatAutocompleteSelectedEvent) {
    this.seleccionado.emit(ev.option.value as OpcionBuscar);
  }
}
