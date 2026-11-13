import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsolaService } from './consola.service';
import { EmpresaLista, Plan } from './consola.models';
import { Pagina } from '../../core/modelos';
import { EstadoChip } from './estado-chip';
import { EmpresaForm } from './empresa-form';
import { ClaveDialog } from '../../shared/clave-dialog';

@Component({
  selector: 'lt-empresas',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoChip,
  ],
  template: `
    <!-- Filtros -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <div class="relative w-64">
        <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue !text-xl pointer-events-none">search</mat-icon>
        <input class="lt-input !pl-10" placeholder="Buscar por nombre o RUC" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
      </div>
      <select class="lt-input !w-44" [(ngModel)]="estado" (change)="recargar()">
        <option value="">Todos los estados</option>
        <option value="AL_DIA">Al día</option>
        <option value="POR_VENCER">Por vencer</option>
        <option value="VENCIDO">Vencido</option>
        <option value="INACTIVA">Inactiva</option>
      </select>
      <select class="lt-input !w-44" [(ngModel)]="planId" (change)="recargar()">
        <option [ngValue]="0">Todos los planes</option>
        @for (p of planes(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
      </select>

      <span class="flex-1"></span>

      <button mat-flat-button color="primary" (click)="nueva()">
        <mat-icon>add</mat-icon> Nueva empresa
      </button>
    </div>

    <!-- Tabla -->
    <div class="rounded-2xl border border-borde bg-superficie overflow-hidden">
      @if (cargando()) {
        <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
      } @else if (pagina(); as pg) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-texto-tenue text-xs uppercase tracking-wide border-b border-borde bg-superficie-2">
              <tr>
                <th class="text-left font-medium px-4 py-3">Empresa</th>
                <th class="text-left font-medium px-4 py-3">Plan</th>
                <th class="text-left font-medium px-4 py-3">Estado</th>
                <th class="text-right font-medium px-4 py-3">Sedes</th>
                <th class="text-right font-medium px-4 py-3">Usuarios</th>
                <th class="text-left font-medium px-4 py-3">Vence</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (e of pg.items; track e.id) {
                <tr class="hover:bg-superficie-2 transition-colors">
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ e.nombreComercial }}</div>
                    <div class="text-xs text-texto-tenue">{{ e.ruc }}</div>
                  </td>
                  <td class="px-4 py-3">{{ e.plan }}</td>
                  <td class="px-4 py-3"><lt-estado-chip [estado]="e.estadoServicio" [dias]="e.diasRestantes" /></td>
                  <td class="px-4 py-3 text-right">{{ e.sedes }}</td>
                  <td class="px-4 py-3 text-right">{{ e.usuarios }}</td>
                  <td class="px-4 py-3">{{ e.servicioHasta | date: 'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-3 text-right">
                    <a mat-icon-button [routerLink]="['/sa/empresas', e.id]" aria-label="Ver">
                      <mat-icon>chevron_right</mat-icon>
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="text-center text-texto-tenue py-10">No hay empresas que coincidan.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginacion -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} empresa(s)</span>
          <div class="flex items-center gap-2">
            <button mat-icon-button [disabled]="pg.paginaActual <= 1" (click)="irA(pg.paginaActual - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span>{{ pg.paginaActual }} / {{ pg.totalPaginas || 1 }}</span>
            <button mat-icon-button [disabled]="!pg.hayMas" (click)="irA(pg.paginaActual + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Empresas {
  private api = inject(ConsolaService);
  private dialog = inject(MatDialog);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<EmpresaLista> | null>(null);
  readonly planes = signal<Plan[]>([]);

  buscar = '';
  estado = '';
  planId = 0;
  private pag = 1;

  constructor() {
    this.api.planes().subscribe((p) => this.planes.set(p));
    this.cargar();
  }

  recargar(): void {
    this.pag = 1;
    this.cargar();
  }

  irA(p: number): void {
    this.pag = p;
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.api
      .empresas({
        pagina: this.pag,
        tamano: 15,
        buscar: this.buscar || undefined,
        estado: this.estado || undefined,
        planId: this.planId || undefined,
      })
      .subscribe({
        next: (pg) => {
          this.pagina.set(pg);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  nueva(): void {
    this.dialog
      .open(EmpresaForm, { width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((creada) => {
        if (creada) {
          this.dialog.open(ClaveDialog, {
            width: '440px',
            data: { titulo: 'Empresa creada', email: creada.emailAdmin, clave: creada.claveTemporal },
          });
          this.recargar();
        }
      });
  }
}
