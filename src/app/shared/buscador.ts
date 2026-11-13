import { Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

export interface OpcionBuscar {
  valor: number;
  texto: string;
  sub?: string;
}

/**
 * Buscador con autocompletado contra el backend. Input limpio (estilo de marca,
 * sin Angular Material) + un desplegable propio. Recibe una función texto ->
 * opciones y emite el id elegido.
 */
@Component({
  selector: 'lt-buscador',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (label()) { <label class="lt-label">{{ label() }}</label> }
    <div class="relative">
      <input class="lt-input !pr-9" [formControl]="control" [placeholder]="placeholder()"
             autocomplete="off" (focus)="abierto.set(true)" (blur)="cerrarPronto()" />
      <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-texto-tenue pointer-events-none flex">
        @if (cargando()) { <mat-spinner diameter="16" /> }
        @else { <mat-icon class="!text-lg !w-5 !h-5">search</mat-icon> }
      </span>

      @if (abierto() && mostrarLista()) {
        <ul class="absolute z-[1200] left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl
                   border border-borde bg-superficie shadow-lg py-1">
          @for (o of opciones(); track o.valor) {
            <li>
              <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-superficie-2 transition-colors"
                      (mousedown)="elegir(o)">
                <span class="font-medium">{{ o.texto }}</span>
                @if (o.sub) { <span class="text-texto-tenue text-xs ml-2">{{ o.sub }}</span> }
              </button>
            </li>
          } @empty {
            <li class="px-3 py-2 text-sm text-texto-tenue">Sin resultados.</li>
          }
        </ul>
      }
    </div>
  `,
})
export class Buscador {
  label = input('');
  placeholder = input('Escribe para buscar…');
  buscar = input.required<(q: string) => Observable<OpcionBuscar[]>>();

  readonly seleccionado = output<OpcionBuscar | null>();

  readonly control = new FormControl<string>('', { nonNullable: true });
  readonly opciones = signal<OpcionBuscar[]>([]);
  readonly cargando = signal(false);
  readonly abierto = signal(false);

  private elegido = false;

  constructor() {
    this.control.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((v) => {
          // Si acabamos de elegir una opción, no se vuelve a buscar.
          if (this.elegido) { this.elegido = false; return []; }
          const q = (v ?? '').trim();
          if (q.length < 2) {
            this.opciones.set([]);
            this.seleccionado.emit(null);
            return [];
          }
          this.cargando.set(true);
          this.abierto.set(true);
          return this.buscar()(q);
        }),
      )
      .subscribe({
        next: (opts) => { this.opciones.set(opts); this.cargando.set(false); },
        error: () => { this.opciones.set([]); this.cargando.set(false); },
      });
  }

  /** La lista se muestra si hay opciones, o si se buscó algo y no hubo resultados. */
  mostrarLista(): boolean {
    return this.opciones().length > 0 || (!this.cargando() && (this.control.value ?? '').trim().length >= 2);
  }

  elegir(o: OpcionBuscar): void {
    this.elegido = true;
    this.control.setValue(o.texto);
    this.opciones.set([]);
    this.abierto.set(false);
    this.seleccionado.emit(o);
  }

  cerrarPronto(): void {
    // Un respiro para que el mousedown de la opción alcance a dispararse.
    setTimeout(() => this.abierto.set(false), 150);
  }
}
