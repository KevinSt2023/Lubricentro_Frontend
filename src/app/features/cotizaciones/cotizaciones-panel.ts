import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin, of, switchMap } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionDetalle, Hallazgo, SEVERIDADES } from './cotizaciones.models';
import { CotizacionFormDialog } from './cotizacion-form-dialog';
import { AccionDialog } from '../../shared/accion-dialog';
import { SesionService } from '../../core/sesion.service';
import { ErrorApi } from '../../core/modelos';

/**
 * El bloque de cotizaciones de una orden (Fase 4), para el ERP del taller:
 * hallazgos del técnico, cotizaciones versionadas del asesor, su estado y la
 * decisión del cliente. El cliente aprueba o rechaza desde SU portal; aquí solo
 * se arma, se envía y, una vez aprobada, se aplica a la orden.
 */
@Component({
  selector: 'lt-cotizaciones-panel',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <!-- Hallazgos -->
    <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-semibold">Hallazgos del técnico</h3>
          <p class="text-texto-tenue text-xs">Lo que hay que cotizar antes de ejecutar.</p>
        </div>
        @if (sesion.puede('COTIZACION.HALLAZGO') && !estadoFinal()) {
          <button mat-stroked-button (click)="nuevoHallazgo()"><mat-icon>add</mat-icon> Registrar</button>
        }
      </div>
      @if (hallazgos().length) {
        <ul class="divide-y divide-borde">
          @for (h of hallazgos(); track h.id) {
            <li class="py-2.5 flex items-start justify-between gap-3">
              <div class="flex items-start gap-2">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium mt-0.5" [class]="sev(h.severidad)">{{ h.severidad }}</span>
                <div>
                  <div class="text-sm">{{ h.descripcion }}</div>
                  <div class="text-xs text-texto-tenue">{{ h.creadoEn | date: 'dd/MM/yy HH:mm' }} · {{ h.autor || 'sistema' }}</div>
                </div>
              </div>
              @if (sesion.puede('COTIZACION.HALLAZGO') && !estadoFinal() && !h.atendido) {
                <button mat-icon-button (click)="quitarHallazgo(h)" matTooltip="Quitar"><mat-icon class="!text-base">delete</mat-icon></button>
              }
            </li>
          }
        </ul>
      } @else { <p class="text-texto-tenue text-sm">Sin hallazgos registrados.</p> }
    </div>

    <!-- Cotizaciones -->
    @if (sesion.puedeAlguno('COTIZACION.VER', 'COTIZACION.CREAR')) {
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-semibold">Cotizaciones</h3>
            <p class="text-texto-tenue text-xs">El cliente las aprueba desde su portal.</p>
          </div>
          @if (sesion.puede('COTIZACION.CREAR') && !estadoFinal()) {
            <button mat-flat-button color="primary" (click)="nueva()"><mat-icon>request_quote</mat-icon> Nueva cotización</button>
          }
        </div>

        @if (cotizaciones().length) {
          <div class="flex flex-col gap-3">
            @for (c of cotizaciones(); track c.id) {
              <div class="rounded-xl border border-borde p-4" [class.opacity-60]="c.estado === 'REEMPLAZADA' || c.estado === 'VENCIDA'">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">Versión {{ c.version }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" [class]="chipEstado(c.estado)">{{ etiqueta(c.estado) }}</span>
                  </div>
                  <span class="font-bold">S/ {{ c.total | number: '1.2-2' }}</span>
                </div>

                <ul class="mt-2 divide-y divide-borde text-sm">
                  @for (r of c.renglones; track r.id) {
                    <li class="py-1.5 flex items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5">
                        <mat-icon class="!text-sm !w-4 !h-4 text-texto-tenue">{{ r.tipo === 'SERVICIO' ? 'build' : 'inventory_2' }}</mat-icon>
                        {{ r.descripcion }} <span class="text-texto-tenue">× {{ r.cantidad | number: '1.0-3' }}</span>
                      </span>
                      <span>S/ {{ r.subtotal | number: '1.2-2' }}</span>
                    </li>
                  }
                </ul>

                @if (c.nota) { <p class="text-xs text-texto-tenue mt-2 italic">“{{ c.nota }}”</p> }

                @if (c.decision; as d) {
                  <div class="mt-3 rounded-lg px-3 py-2 text-sm" [class]="d.decision === 'APROBADA' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-marca-soft text-marca'">
                    <b>{{ d.decision === 'APROBADA' ? 'Aprobada' : 'Rechazada' }}</b> por el cliente · {{ d.creadoEn | date: 'dd/MM/yy HH:mm' }}
                    @if (d.comentario) { <span class="block text-texto-tenue mt-0.5">“{{ d.comentario }}”</span> }
                  </div>
                } @else if (c.estado === 'ENVIADA') {
                  <div class="mt-3 flex items-center gap-2 text-sm text-amber-600">
                    <mat-icon class="!text-base">hourglass_top</mat-icon> Esperando la decisión del cliente en su portal.
                  </div>
                }

                @if (!estadoFinal()) {
                  <div class="mt-3 flex items-center gap-2 flex-wrap">
                    @if (c.estado === 'BORRADOR' && sesion.puede('COTIZACION.CREAR')) {
                      <button mat-stroked-button (click)="editar(c)"><mat-icon>edit</mat-icon> Editar</button>
                      @if (sesion.puede('COTIZACION.ENVIAR')) {
                        <button mat-flat-button color="primary" (click)="enviar(c)"><mat-icon>send</mat-icon> Enviar al cliente</button>
                      }
                    }
                    @if (c.estado === 'APROBADA' && sesion.puede('COTIZACION.CREAR')) {
                      <button mat-flat-button color="primary" (click)="aplicar(c)"><mat-icon>playlist_add_check</mat-icon> Pasar servicios a la orden</button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        } @else { <p class="text-texto-tenue text-sm">Sin cotizaciones. Arma una desde los hallazgos.</p> }
      </div>
    }
  `,
})
export class CotizacionesPanel {
  readonly sesion = inject(SesionService);
  private api = inject(CotizacionesService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly ordenId = input.required<number>();
  readonly estadoFinal = input<boolean>(false);
  /** Se emite cuando una acción cambia los totales de la orden (aplicar). */
  readonly aplicada = output<void>();

  readonly hallazgos = signal<Hallazgo[]>([]);
  readonly cotizaciones = signal<CotizacionDetalle[]>([]);

  constructor() {
    effect(() => { const id = this.ordenId(); if (id) this.cargar(id); });
  }

  private cargar(id: number) {
    this.api.hallazgos(id).subscribe({ next: (h) => this.hallazgos.set(h), error: () => {} });
    this.api.porOrden(id).pipe(
      switchMap((lista) => lista.length ? forkJoin(lista.map((c) => this.api.ver(c.id))) : of([])),
    ).subscribe({ next: (dets) => this.cotizaciones.set(dets), error: () => {} });
  }

  private recargar() { this.cargar(this.ordenId()); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }
  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); }

  sev(s: string) {
    return s === 'CRITICO' ? 'bg-marca-soft text-marca'
      : s === 'MODERADO' ? 'bg-amber-500/10 text-amber-600' : 'bg-acero-400/15 text-texto-tenue';
  }
  chipEstado(e: string) {
    return e === 'APROBADA' ? 'bg-emerald-500/10 text-emerald-600'
      : e === 'ENVIADA' ? 'bg-amber-500/10 text-amber-600'
      : e === 'RECHAZADA' ? 'bg-marca-soft text-marca'
      : e === 'BORRADOR' ? 'bg-marca/10 text-marca' : 'bg-acero-400/15 text-texto-tenue';
  }
  etiqueta(e: string) {
    return { BORRADOR: 'Borrador', ENVIADA: 'Enviada', APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada', REEMPLAZADA: 'Reemplazada', VENCIDA: 'Vencida' }[e] ?? e;
  }

  nuevoHallazgo() {
    this.dialog.open(AccionDialog, { width: '440px', data: { titulo: 'Registrar hallazgo', confirmar: 'Registrar', campos: [
      { clave: 'descripcion', label: 'Qué se encontró', tipo: 'area', requerido: true },
      { clave: 'severidad', label: 'Severidad', tipo: 'select', valor: 'MODERADO', opciones: SEVERIDADES.map((s) => ({ valor: s, texto: s })) },
    ] } }).afterClosed().subscribe((v) => {
      if (!v) return;
      this.api.registrarHallazgo(this.ordenId(), { descripcion: v.descripcion, severidad: v.severidad })
        .subscribe({ next: () => { this.ok('Hallazgo registrado.'); this.recargar(); }, error: (e) => this.err(e) });
    });
  }

  quitarHallazgo(h: Hallazgo) {
    this.api.quitarHallazgo(this.ordenId(), h.id)
      .subscribe({ next: () => { this.ok('Hallazgo quitado.'); this.recargar(); }, error: (e) => this.err(e) });
  }

  nueva() {
    this.dialog.open(CotizacionFormDialog, { width: '680px', maxWidth: '95vw', data: { ordenId: this.ordenId() } })
      .afterClosed().subscribe((body) => {
        if (!body) return;
        this.api.crear(this.ordenId(), body)
          .subscribe({ next: () => { this.ok('Cotización creada en borrador.'); this.recargar(); }, error: (e) => this.err(e) });
      });
  }

  editar(c: CotizacionDetalle) {
    this.dialog.open(CotizacionFormDialog, { width: '680px', maxWidth: '95vw', data: { ordenId: this.ordenId(), cotizacion: c } })
      .afterClosed().subscribe((body) => {
        if (!body) return;
        this.api.actualizar(c.id, body)
          .subscribe({ next: () => { this.ok('Cotización actualizada.'); this.recargar(); }, error: (e) => this.err(e) });
      });
  }

  enviar(c: CotizacionDetalle) {
    this.api.enviar(c.id).subscribe({ next: () => { this.ok('Cotización enviada al cliente.'); this.recargar(); }, error: (e) => this.err(e) });
  }

  aplicar(c: CotizacionDetalle) {
    this.api.aplicar(c.id).subscribe({
      next: () => { this.ok('Servicios aprobados pasados a la orden.'); this.recargar(); this.aplicada.emit(); },
      error: (e) => this.err(e),
    });
  }
}
