import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsolaService } from './consola.service';
import { Funcion, Plan } from './consola.models';

@Component({
  selector: 'lt-planes',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (cargando()) {
      <div class="grid place-items-center py-20"><mat-spinner diameter="40" /></div>
    } @else {
      <div class="grid gap-4 md:grid-cols-3">
        @for (p of planes(); track p.id) {
          <div class="rounded-2xl border border-borde bg-superficie p-6 flex flex-col"
               [class.ring-2]="p.codigo === 'PREMIUM'" [class.ring-marca]="p.codigo === 'PREMIUM'">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold">{{ p.nombre }}</h3>
              @if (!p.activo) { <span class="text-xs text-texto-tenue">inactivo</span> }
            </div>
            <div class="mt-2">
              <span class="text-3xl font-extrabold">S/ {{ p.precioMensual | number: '1.0-0' }}</span>
              <span class="text-texto-tenue text-sm">/ mes</span>
            </div>
            <div class="text-xs text-texto-tenue mt-1">
              {{ p.empresas }} empresa(s) · {{ p.maxSedes === 0 ? 'sedes ilimitadas' : p.maxSedes + ' sede(s)' }}
            </div>

            <div class="mt-4 pt-4 border-t border-borde">
              <div class="text-xs font-semibold text-texto-tenue uppercase mb-2">Funciones</div>
              <ul class="flex flex-col gap-1.5">
                @for (f of p.funciones; track f) {
                  <li class="flex items-center gap-2 text-sm">
                    <mat-icon class="!w-4 !h-4 !text-base text-emerald-500">check</mat-icon>
                    {{ nombreFuncion(f) }}
                  </li>
                } @empty {
                  <li class="text-sm text-texto-tenue">—</li>
                }
              </ul>
            </div>

            <div class="mt-4 pt-4 border-t border-borde">
              <div class="text-xs font-semibold text-texto-tenue uppercase mb-2">Cupos por rol</div>
              <div class="flex flex-wrap gap-1.5">
                @for (c of p.cupos; track c.rolId) {
                  <span class="text-xs px-2 py-1 rounded-md bg-superficie-2">
                    {{ c.rol }}: {{ c.cupo === 0 ? '∞' : c.cupo }}
                  </span>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <p class="text-xs text-texto-tenue mt-4">
        Los precios son provisionales. La edición de cupos y funciones por plan llega en una próxima entrega.
      </p>
    }
  `,
})
export class Planes {
  private api = inject(ConsolaService);
  readonly cargando = signal(true);
  readonly planes = signal<Plan[]>([]);
  private funciones: Record<string, string> = {};

  constructor() {
    this.api.funciones().subscribe((fs: Funcion[]) => {
      for (const f of fs) this.funciones[f.codigo] = f.nombre;
    });
    this.api.planes().subscribe({
      next: (p) => {
        this.planes.set(p.sort((a, b) => a.orden - b.orden));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  nombreFuncion(codigo: string): string {
    return this.funciones[codigo] ?? codigo;
  }
}
