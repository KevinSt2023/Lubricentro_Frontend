import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ConsolaService } from './consola.service';
import { EmpresaDetalle, Plan, SaludEmpresa, Suscripcion } from './consola.models';
import { Pagina } from '../../core/modelos';
import { ErrorApi } from '../../core/modelos';
import { EstadoChip } from './estado-chip';
import { AccionDialog } from '../../shared/accion-dialog';
import { ClaveDialog } from '../../shared/clave-dialog';

@Component({
  selector: 'lt-empresa-detalle',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    EstadoChip,
  ],
  template: `
    @if (cargando()) {
      <div class="grid place-items-center py-20"><mat-spinner diameter="40" /></div>
    } @else if (empresa(); as e) {
      <!-- Encabezado -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div class="flex items-start gap-3">
          <button mat-icon-button (click)="volver()" aria-label="Volver"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold">{{ e.nombreComercial }}</h1>
              <lt-estado-chip [estado]="e.estadoServicio" [dias]="e.diasRestantes" />
            </div>
            <p class="text-texto-tenue text-sm">{{ e.razonSocial }} · RUC {{ e.ruc }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button mat-flat-button color="primary" (click)="registrarPago(e)">
            <mat-icon>payments</mat-icon> Registrar pago
          </button>
          <button mat-stroked-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon> Acciones
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="cambiarPlan(e)"><mat-icon>sell</mat-icon> Cambiar de plan</button>
            <button mat-menu-item (click)="reiniciarClave(e)"><mat-icon>key</mat-icon> Clave del Admin</button>
            @if (e.activo) {
              <button mat-menu-item (click)="cambiarEstado(e, false)"><mat-icon>block</mat-icon> Dar de baja</button>
            } @else {
              <button mat-menu-item (click)="cambiarEstado(e, true)"><mat-icon>check_circle</mat-icon> Reactivar</button>
            }
          </mat-menu>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Plan y servicio -->
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Plan</div>
          <div class="text-xl font-bold mt-1">{{ e.plan }}</div>
          <div class="text-sm text-texto-tenue">S/ {{ e.precioMensual | number: '1.2-2' }} / mes</div>
          <div class="mt-3 pt-3 border-t border-borde text-sm">
            <div class="flex justify-between"><span class="text-texto-tenue">Servicio hasta</span>
              <b>{{ e.servicioHasta | date: 'dd/MM/yyyy' }}</b></div>
            <div class="flex justify-between mt-1"><span class="text-texto-tenue">Sedes</span>
              <b>{{ e.sedes }}{{ e.maxSedes ? ' / ' + e.maxSedes : '' }}</b></div>
          </div>
        </div>

        <!-- Admin -->
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Admin</div>
          @if (e.admin; as a) {
            <div class="text-lg font-semibold mt-1">{{ a.nombre }}</div>
            <div class="text-sm text-texto-tenue">{{ a.email }}</div>
            <div class="mt-2 text-xs text-texto-tenue">
              Último acceso: {{ a.ultimoAcceso ? (a.ultimoAcceso | date: 'dd/MM/yyyy HH:mm') : 'nunca' }}
            </div>
          } @else {
            <div class="text-sm text-marca mt-1">Sin Admin activo</div>
          }
        </div>

        <!-- Funciones -->
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm mb-2">Funciones del plan</div>
          <div class="flex flex-wrap gap-1.5">
            @for (f of e.funciones; track f) {
              <span class="text-xs px-2 py-1 rounded-md bg-superficie-2 text-texto-tenue">{{ f }}</span>
            } @empty {
              <span class="text-sm text-texto-tenue">—</span>
            }
          </div>
        </div>
      </div>

      <!-- Salud -->
      @if (salud(); as s) {
        <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
          <h3 class="font-semibold mb-3">Salud y cumplimiento</h3>
          @if (s.alertas.length) {
            <div class="flex flex-col gap-2 mb-4">
              @for (a of s.alertas; track a) {
                <div class="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2">
                  <mat-icon class="!w-4 !h-4 !text-base">warning</mat-icon> {{ a }}
                </div>
              }
            </div>
          } @else {
            <div class="flex items-center gap-2 text-sm text-emerald-600 mb-4">
              <mat-icon class="!w-4 !h-4 !text-base">check_circle</mat-icon> Todo en orden.
            </div>
          }
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            @for (u of s.usoPorRol; track u.rolId) {
              <div class="text-sm flex justify-between border border-borde rounded-lg px-3 py-2"
                   [class.border-marca]="u.excedido">
                <span class="text-texto-tenue">{{ u.rol }}</span>
                <b>{{ u.usados }}{{ u.cupo === null ? '' : u.cupo === 0 ? ' / ∞' : ' / ' + u.cupo }}</b>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sedes -->
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <h3 class="font-semibold mb-3">Sedes</h3>
        <ul class="divide-y divide-borde">
          @for (s of empresa()!.listaSedes; track s.id) {
            <li class="py-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2">
                @if (s.esPrincipal) { <mat-icon class="!text-base text-marca">star</mat-icon> }
                <div>
                  <div class="font-medium">{{ s.nombre }}</div>
                  <div class="text-xs text-texto-tenue">{{ s.direccion || '—' }}</div>
                </div>
              </div>
              <span class="text-xs text-texto-tenue">{{ s.usuarios }} usuario(s)</span>
            </li>
          }
        </ul>
      </div>

      <!-- Suscripciones -->
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <h3 class="font-semibold mb-3">Historial de pagos</h3>
        @if (pagos()?.items?.length) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-texto-tenue text-xs uppercase border-b border-borde">
                <tr>
                  <th class="text-left font-medium py-2">Periodo</th>
                  <th class="text-right font-medium py-2">Monto</th>
                  <th class="text-left font-medium py-2 pl-4">Estado</th>
                  <th class="text-left font-medium py-2 pl-4">Referencia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-borde">
                @for (p of pagos()!.items; track p.id) {
                  <tr>
                    <td class="py-2">{{ p.desde | date: 'dd/MM/yy' }} — {{ p.hasta | date: 'dd/MM/yy' }}</td>
                    <td class="py-2 text-right">S/ {{ p.monto | number: '1.2-2' }}</td>
                    <td class="py-2 pl-4">
                      <span class="text-xs px-2 py-0.5 rounded-full"
                            [class]="p.estado === 'PAGADA' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-acero-400/15 text-texto-tenue'">
                        {{ p.estado }}
                      </span>
                    </td>
                    <td class="py-2 pl-4 text-texto-tenue">{{ p.referencia || '—' }}</td>
                    <td class="py-2 text-right">
                      @if (p.estado === 'PAGADA') {
                        <button mat-icon-button (click)="anular(p)" matTooltip="Anular"><mat-icon class="!text-base">undo</mat-icon></button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-texto-tenue text-sm py-4">Sin pagos registrados.</p>
        }
      </div>
    }
  `,
})
export class EmpresaDetallePagina {
  private api = inject(ConsolaService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly empresa = signal<EmpresaDetalle | null>(null);
  readonly salud = signal<SaludEmpresa | null>(null);
  readonly pagos = signal<Pagina<Suscripcion> | null>(null);
  readonly planes = signal<Plan[]>([]);

  private id = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    this.api.planes().subscribe((p) => this.planes.set(p));
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    forkJoin({
      e: this.api.empresa(this.id),
      s: this.api.salud(this.id),
      p: this.api.suscripcionesDe(this.id, 1, 20),
    }).subscribe({
      next: ({ e, s, p }) => {
        this.empresa.set(e);
        this.salud.set(s);
        this.pagos.set(p);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  volver(): void {
    this.location.back();
  }

  private ok(msg: string): void {
    this.snack.open(msg, 'OK', { duration: 3000 });
    this.cargar();
  }
  private err(e: unknown): void {
    const m = (e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo completar la acción.';
    this.snack.open(m, 'Cerrar', { duration: 5000 });
  }

  registrarPago(e: EmpresaDetalle): void {
    this.dialog
      .open(AccionDialog, {
        width: '420px',
        data: {
          titulo: 'Registrar pago',
          mensaje: `El periodo encadena con el último pagado. Plan ${e.plan}.`,
          confirmar: 'Registrar',
          campos: [
            { clave: 'meses', label: 'Meses', tipo: 'numero', valor: 1, requerido: true },
            { clave: 'referencia', label: 'N° de operación / voucher', tipo: 'texto' },
          ],
        },
      })
      .afterClosed()
      .subscribe((v) => {
        if (!v) return;
        this.api.registrarPago(this.id, Number(v.meses), v.referencia || undefined).subscribe({
          next: () => this.ok('Pago registrado.'),
          error: (e) => this.err(e),
        });
      });
  }

  cambiarPlan(e: EmpresaDetalle): void {
    this.dialog
      .open(AccionDialog, {
        width: '420px',
        data: {
          titulo: 'Cambiar de plan',
          confirmar: 'Cambiar',
          campos: [
            {
              clave: 'planCodigo', label: 'Nuevo plan', tipo: 'select', requerido: true,
              valor: e.plan,
              opciones: this.planes().map((p) => ({ valor: p.codigo, texto: `${p.nombre} — S/ ${p.precioMensual}` })),
            },
            { clave: 'motivo', label: 'Motivo (opcional)', tipo: 'texto' },
          ],
        },
      })
      .afterClosed()
      .subscribe((v) => {
        if (!v) return;
        this.api.cambiarPlan(this.id, String(v.planCodigo), v.motivo || undefined).subscribe({
          next: () => this.ok('Plan actualizado.'),
          error: (e) => this.err(e),
        });
      });
  }

  cambiarEstado(e: EmpresaDetalle, activar: boolean): void {
    if (activar) {
      this.api.cambiarEstado(this.id, true).subscribe({ next: () => this.ok('Empresa reactivada.'), error: (x) => this.err(x) });
      return;
    }
    this.dialog
      .open(AccionDialog, {
        width: '420px',
        data: {
          titulo: 'Dar de baja',
          mensaje: 'La baja corta el acceso al instante. Queda en la bitácora.',
          confirmar: 'Dar de baja',
          peligro: true,
          campos: [{ clave: 'motivo', label: 'Motivo', tipo: 'area', requerido: true }],
        },
      })
      .afterClosed()
      .subscribe((v) => {
        if (!v) return;
        this.api.cambiarEstado(this.id, false, String(v.motivo)).subscribe({
          next: () => this.ok('Empresa dada de baja.'),
          error: (e) => this.err(e),
        });
      });
  }

  reiniciarClave(e: EmpresaDetalle): void {
    this.api.reiniciarClaveAdmin(this.id).subscribe({
      next: (r) =>
        this.dialog.open(ClaveDialog, {
          width: '440px',
          data: { titulo: 'Clave temporal nueva', email: e.admin?.email, clave: r.claveTemporal },
        }),
      error: (e) => this.err(e),
    });
  }

  anular(p: Suscripcion): void {
    this.dialog
      .open(AccionDialog, {
        width: '420px',
        data: {
          titulo: 'Anular pago',
          mensaje: 'El servicio se recalcula desde los pagos que queden.',
          confirmar: 'Anular',
          peligro: true,
          campos: [{ clave: 'motivo', label: 'Motivo', tipo: 'area', requerido: true }],
        },
      })
      .afterClosed()
      .subscribe((v) => {
        if (!v) return;
        this.api.anularPago(p.id, String(v.motivo)).subscribe({
          next: () => this.ok('Pago anulado.'),
          error: (e) => this.err(e),
        });
      });
  }
}
