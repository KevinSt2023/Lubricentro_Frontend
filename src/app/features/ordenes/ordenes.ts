import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdenesService } from './ordenes.service';
import { EstadoOrden, OrdenItem } from './ordenes.models';
import { ErrorApi } from '../../core/modelos';
import { NuevaOrdenDialog } from './nueva-orden-dialog';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-ordenes',
  standalone: true,
  imports: [DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Órdenes de trabajo</h1>
        <p class="text-texto-tenue text-sm">El tablero del taller, por estado.</p>
      </div>
      @if (sesion.puede('ORDENES.CREAR')) {
        <button mat-flat-button color="primary" (click)="nueva()"><mat-icon>add</mat-icon> Nueva orden</button>
      }
    </div>

    @if (cargando()) {
      <div class="grid place-items-center py-20"><mat-spinner diameter="40" /></div>
    } @else {
      <!-- Tablero kanban: scroll horizontal, una columna por estado del flujo -->
      <div class="flex gap-4 overflow-x-auto pb-4" style="scroll-snap-type: x proximity;">
        @for (col of columnas(); track col.estado.id) {
          <div class="flex-shrink-0 w-72" style="scroll-snap-align: start;">
            <div class="flex items-center justify-between mb-2 px-1">
              <span class="text-sm font-semibold">{{ col.estado.nombre }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-superficie-2 text-texto-tenue">{{ col.ordenes.length }}</span>
            </div>
            <div class="flex flex-col gap-2 min-h-[4rem] rounded-xl p-1 bg-superficie-2/40">
              @for (o of col.ordenes; track o.id) {
                <button (click)="abrir(o)"
                        class="text-left rounded-xl border border-borde bg-superficie p-3 hover:border-marca/50 hover:shadow-sm transition-all">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs px-1.5 py-0.5 rounded bg-superficie-2 border border-borde">#{{ o.numero }}</span>
                    <span class="font-mono font-semibold text-sm">{{ o.placa }}</span>
                  </div>
                  <div class="text-sm mt-1.5 font-medium truncate">{{ o.vehiculo }}</div>
                  <div class="text-xs text-texto-tenue truncate">{{ o.cliente }}</div>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs text-texto-tenue flex items-center gap-1">
                      <mat-icon class="!text-sm !w-4 !h-4">engineering</mat-icon>{{ o.tecnico || 'sin asignar' }}
                    </span>
                    <span class="text-xs font-semibold">S/ {{ o.total | number: '1.0-0' }}</span>
                  </div>
                </button>
              } @empty {
                <div class="text-center text-texto-tenue text-xs py-4">—</div>
              }
            </div>
          </div>
        }
      </div>

      @if (finales().length) {
        <div class="mt-6">
          <h3 class="text-sm font-semibold text-texto-tenue mb-2">Cerradas recientes</h3>
          <div class="flex flex-wrap gap-2">
            @for (o of finales(); track o.id) {
              <button (click)="abrir(o)"
                      class="rounded-lg border border-borde bg-superficie px-3 py-2 text-sm hover:border-marca/40"
                      [class.opacity-60]="o.estado === 'Anulada'">
                <span class="font-mono text-xs">#{{ o.numero }}</span> · {{ o.placa }} ·
                <span [class.text-marca]="o.estado === 'Anulada'" [class.text-emerald-600]="o.estado === 'Entregada'">{{ o.estado }}</span>
              </button>
            }
          </div>
        </div>
      }
    }
  `,
})
export class Ordenes {
  readonly sesion = inject(SesionService);
  private api = inject(OrdenesService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  private readonly estados = signal<EstadoOrden[]>([]);
  private readonly ordenes = signal<OrdenItem[]>([]);

  readonly columnas = computed(() => {
    const flujo = this.estados().filter((e) => !e.esFinal && !e.esAnulacion).sort((a, b) => a.secuencia - b.secuencia);
    return flujo.map((estado) => ({ estado, ordenes: this.ordenes().filter((o) => o.estadoId === estado.id) }));
  });

  readonly finales = computed(() => this.ordenes().filter((o) => o.estadoFinal));

  constructor() {
    this.api.estados().subscribe((e) => this.estados.set(e));
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    this.api.listar({ pagina: 1, tamano: 100 }).subscribe({
      next: (pg) => { this.ordenes.set(pg.items); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrir(o: OrdenItem) {
    this.router.navigate(['/ordenes', o.id]);
  }

  nueva() {
    this.dialog.open(NuevaOrdenDialog, { width: '480px', maxWidth: '95vw' })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.crear(v).subscribe({
          next: (o) => this.router.navigate(['/ordenes', o.id]),
          error: (e) => this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo abrir la orden.', 'Cerrar', { duration: 5000 }),
        });
      });
  }
}
