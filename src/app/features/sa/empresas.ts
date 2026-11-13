import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoChip,
  ],
  template: `
    <!-- Filtros -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <mat-form-field appearance="outline" class="!w-64" subscriptSizing="dynamic">
        <mat-icon matPrefix class="text-texto-tenue !ml-2">search</mat-icon>
        <input matInput placeholder="Buscar por nombre o RUC" [(ngModel)]="buscar"
               (keyup.enter)="recargar()" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="!w-44" subscriptSizing="dynamic">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="estado" (selectionChange)="recargar()">
          <mat-option value="">Todos</mat-option>
          <mat-option value="AL_DIA">Al día</mat-option>
          <mat-option value="POR_VENCER">Por vencer</mat-option>
          <mat-option value="VENCIDO">Vencido</mat-option>
          <mat-option value="INACTIVA">Inactiva</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="!w-44" subscriptSizing="dynamic">
        <mat-label>Plan</mat-label>
        <mat-select [(ngModel)]="planId" (selectionChange)="recargar()">
          <mat-option [value]="0">Todos</mat-option>
          @for (p of planes(); track p.id) {
            <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

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
