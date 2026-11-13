import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdenesService } from './ordenes.service';
import { EstadoOrden, OrdenDetalle } from './ordenes.models';
import { MaestrosService } from '../maestros/maestros.service';
import { ROLES } from '../maestros/maestros.models';
import { OpcionBuscar } from '../../shared/buscador';
import { map } from 'rxjs';
import { ErrorApi } from '../../core/modelos';
import { environment } from '../../../environments/environment';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { ChecklistDialog } from './checklist-dialog';
import { CotizacionesPanel } from '../cotizaciones/cotizaciones-panel';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-orden-detalle',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatTooltipModule, MatProgressSpinnerModule, CotizacionesPanel,
  ],
  template: `
    @if (cargando()) {
      <div class="grid place-items-center py-20"><mat-spinner diameter="40" /></div>
    } @else if (orden(); as o) {
      <!-- Encabezado -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div class="flex items-start gap-3">
          <button mat-icon-button (click)="volver()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-bold">Orden #{{ o.numero }}</h1>
              <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                    [class]="o.estado === 'Anulada' ? 'bg-marca-soft text-marca' : o.estadoFinal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-marca/10 text-marca'">
                {{ o.estado }}
              </span>
            </div>
            <p class="text-texto-tenue text-sm">
              <span class="font-mono font-semibold text-texto">{{ o.placa }}</span> · {{ o.vehiculo }} · {{ o.cliente }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          @if (siguiente() && !o.estadoFinal && sesion.puede('ORDENES.ESTADO')) {
            <button mat-flat-button color="primary" (click)="avanzar()">
              <mat-icon>arrow_forward</mat-icon> Pasar a {{ siguiente()!.nombre }}
            </button>
          }
          <button mat-stroked-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
          <mat-menu #menu="matMenu">
            @if (sesion.puede('ORDENES.ASIGNAR') && !o.estadoFinal) {
              <button mat-menu-item (click)="asignar()"><mat-icon>engineering</mat-icon> Asignar técnico</button>
            }
            @if (sesion.puede('ORDENES.CHECKLIST') && !o.estadoFinal) {
              <button mat-menu-item (click)="checklist()"><mat-icon>checklist</mat-icon> Checklist</button>
            }
            @if (sesion.puede('ORDENES.ANULAR') && !o.estadoFinal) {
              <button mat-menu-item (click)="anular()"><mat-icon>cancel</mat-icon> Anular orden</button>
            }
          </mat-menu>
        </div>
      </div>

      @if (o.anuladaMotivo) {
        <div class="rounded-xl bg-marca-soft text-marca px-4 py-3 text-sm mb-4">
          <b>Anulada:</b> {{ o.anuladaMotivo }}
        </div>
      }

      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Datos -->
        <div class="rounded-2xl border border-borde bg-superficie p-5 lg:col-span-2">
          <div class="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><span class="text-texto-tenue">Técnico</span><div class="font-medium">{{ o.tecnico || 'Sin asignar' }}</div></div>
            <div><span class="text-texto-tenue">Asesor</span><div class="font-medium">{{ o.asesor || '—' }}</div></div>
            <div><span class="text-texto-tenue">Kilometraje ingreso</span><div class="font-medium">{{ o.kilometrajeIngreso ? (o.kilometrajeIngreso | number) + ' km' : '—' }}</div></div>
            <div><span class="text-texto-tenue">Recibido</span><div class="font-medium">{{ o.recibidoEn ? (o.recibidoEn | date: 'dd/MM/yy HH:mm') : '—' }}</div></div>
          </div>
          @if (o.diagnostico || o.observaciones || sesion.puede('ORDENES.ESTADO')) {
            <div class="mt-4 pt-4 border-t border-borde">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-texto-tenue uppercase">Diagnóstico y observaciones</span>
                @if (sesion.puede('ORDENES.ESTADO') && !o.estadoFinal) {
                  <button mat-icon-button (click)="editarDatos()" matTooltip="Editar"><mat-icon class="!text-base">edit</mat-icon></button>
                }
              </div>
              <p class="text-sm">{{ o.diagnostico || 'Sin diagnóstico.' }}</p>
              @if (o.observaciones) { <p class="text-sm text-texto-tenue mt-1">{{ o.observaciones }}</p> }
            </div>
          }
        </div>

        <!-- Totales -->
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Total</div>
          <div class="text-3xl font-bold">S/ {{ o.total | number: '1.2-2' }}</div>
          <div class="mt-3 pt-3 border-t border-borde text-sm flex flex-col gap-1">
            <span class="flex justify-between"><span class="text-texto-tenue">Servicios</span><b>S/ {{ o.totalServicios | number: '1.2-2' }}</b></span>
            <span class="flex justify-between"><span class="text-texto-tenue">Repuestos</span><b>S/ {{ o.totalRepuestos | number: '1.2-2' }}</b></span>
            @if (o.margen != null) {
              <span class="flex justify-between text-emerald-600 mt-1 pt-1 border-t border-borde"><span>Margen</span><b>S/ {{ o.margen | number: '1.2-2' }}</b></span>
            }
          </div>
        </div>
      </div>

      <!-- Servicios -->
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Servicios</h3>
          @if (sesion.puede('ORDENES.ESTADO') && !o.estadoFinal) {
            <button mat-stroked-button (click)="agregarServicio()"><mat-icon>add</mat-icon> Agregar</button>
          }
        </div>
        @if (o.servicios.length) {
          <ul class="divide-y divide-borde">
            @for (s of o.servicios; track s.id) {
              <li class="py-2.5 flex items-center justify-between">
                <div><span class="font-medium">{{ s.descripcion }}</span>
                  <span class="text-texto-tenue text-sm"> × {{ s.cantidad }}</span></div>
                <div class="flex items-center gap-3">
                  <span class="font-medium">S/ {{ s.subtotal | number: '1.2-2' }}</span>
                  @if (sesion.puede('ORDENES.ESTADO') && !o.estadoFinal) {
                    <button mat-icon-button (click)="quitarServicio(s.id)"><mat-icon class="!text-base">delete</mat-icon></button>
                  }
                </div>
              </li>
            }
          </ul>
        } @else { <p class="text-texto-tenue text-sm">Sin servicios.</p> }
      </div>

      <!-- Repuestos -->
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Repuestos consumidos</h3>
          @if (sesion.puede('ALMACEN.CONSUMIR') && o.estado === 'En ejecucion') {
            <button mat-stroked-button (click)="consumir()"><mat-icon>add</mat-icon> Consumir</button>
          }
        </div>
        @if (o.consumos.length) {
          <ul class="divide-y divide-borde">
            @for (c of o.consumos; track c.id) {
              <li class="py-2.5 flex items-center justify-between">
                <div><span class="font-medium">{{ c.producto }}</span>
                  <span class="text-texto-tenue text-sm"> × {{ c.cantidad | number: '1.0-3' }}</span></div>
                <span class="font-medium">S/ {{ c.subtotal | number: '1.2-2' }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="text-texto-tenue text-sm">
            Sin repuestos.
            @if (o.estado !== 'En ejecucion' && !o.estadoFinal) { <span>Solo se consumen con la orden En ejecución.</span> }
          </p>
        }
      </div>

      <!-- Cotizaciones y hallazgos (Fase 4) -->
      <lt-cotizaciones-panel [ordenId]="o.id" [estadoFinal]="o.estadoFinal" (aplicada)="refrescar()" />

      <!-- Checklist -->
      @if (o.checklist.length) {
        <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
          <h3 class="font-semibold mb-3">Checklist de inspección</h3>
          <div class="grid sm:grid-cols-2 gap-2">
            @for (c of o.checklist; track c.id) {
              <div class="flex items-center justify-between text-sm border border-borde rounded-lg px-3 py-2">
                <span>{{ c.item }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" [class]="chip(c.resultado)">{{ c.resultado }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Evidencias -->
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Evidencias</h3>
          @if (sesion.puede('ORDENES.EVIDENCIA') && !o.estadoFinal) {
            <button mat-stroked-button (click)="archivo.click()"><mat-icon>photo_camera</mat-icon> Subir foto</button>
            <input #archivo type="file" accept="image/jpeg,image/png" hidden (change)="subir($event)" />
          }
        </div>
        @if (o.evidencias.length) {
          <div class="flex flex-wrap gap-2">
            @for (e of o.evidencias; track e.id) {
              <button (click)="descargar(e.id, e.mime)" class="flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm hover:border-marca/40">
                <mat-icon class="!text-base text-marca">{{ e.tipo === 'FOTO' ? 'image' : 'description' }}</mat-icon>
                {{ e.nombre || ('evidencia ' + e.id) }}
              </button>
            }
          </div>
        } @else { <p class="text-texto-tenue text-sm">Sin evidencias.</p> }
      </div>

      <!-- Historial -->
      <div class="rounded-2xl border border-borde bg-superficie p-5 mt-4">
        <h3 class="font-semibold mb-3">Historial</h3>
        <ol class="relative border-l border-borde ml-2">
          @for (h of o.historial; track h.id) {
            <li class="mb-4 ml-4">
              <div class="absolute w-2.5 h-2.5 bg-marca rounded-full -left-[6px] mt-1.5"></div>
              <div class="text-sm font-medium">{{ h.estadoAnterior ? h.estadoAnterior + ' → ' : '' }}{{ h.estadoNuevo }}</div>
              <div class="text-xs text-texto-tenue">{{ h.creadoEn | date: 'dd/MM/yy HH:mm' }} · {{ h.usuario || 'sistema' }}</div>
              @if (h.observacion) { <div class="text-xs mt-0.5">{{ h.observacion }}</div> }
            </li>
          }
        </ol>
      </div>
    }
  `,
})
export class OrdenDetallePagina {
  readonly sesion = inject(SesionService);
  private api = inject(OrdenesService);
  private maestros = inject(MaestrosService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private http = inject(HttpClient);

  readonly cargando = signal(true);
  readonly orden = signal<OrdenDetalle | null>(null);
  private readonly estados = signal<EstadoOrden[]>([]);
  private id = Number(this.route.snapshot.paramMap.get('id'));

  readonly siguiente = computed<EstadoOrden | null>(() => {
    const o = this.orden();
    if (!o) return null;
    const actual = this.estados().find((e) => e.id === o.estadoId);
    if (!actual) return null;
    return this.estados().find((e) => e.secuencia === actual.secuencia + 1 && !e.esAnulacion) ?? null;
  });

  constructor() {
    this.api.estados().subscribe((e) => this.estados.set(e));
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    this.api.ver(this.id).subscribe({
      next: (o) => { this.orden.set(o); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
  refrescar() { this.cargar(); }
  private aplica(o: OrdenDetalle) { this.orden.set(o); }
  private ok(m: string, o?: OrdenDetalle) { this.snack.open(m, 'OK', { duration: 3000 }); if (o) this.aplica(o); else this.cargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  volver() { this.location.back(); }

  chip(r: string) {
    return r === 'OK' ? 'bg-emerald-500/10 text-emerald-600'
      : r === 'OBSERVADO' ? 'bg-amber-500/10 text-amber-600'
      : r === 'MALO' ? 'bg-marca-soft text-marca' : 'bg-acero-400/15 text-texto-tenue';
  }

  avanzar() {
    const s = this.siguiente();
    if (!s) return;
    this.api.cambiarEstado(this.id, s.codigo).subscribe({ next: (o) => this.ok(`Orden en ${s.nombre}.`, o), error: (e) => this.err(e) });
  }

  asignar() {
    this.maestros.personal({ rolId: 6, tamano: 100, activo: true }).subscribe((pg) => {
      const tecnicos = pg.items.length ? pg.items : [];
      this.dialog.open(AccionDialog, { width: '400px', data: { titulo: 'Asignar técnico', confirmar: 'Asignar', campos: [
        { clave: 'tecnicoId', label: 'Técnico', tipo: 'select', requerido: true, valor: this.orden()?.tecnicoId ?? '',
          opciones: tecnicos.map((t) => ({ valor: t.id, texto: `${t.nombre} (${ROLES[t.rolId]})` })) } as CampoAccion,
      ] } }).afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.asignar(this.id, Number(v.tecnicoId)).subscribe({ next: (o) => this.ok('Técnico asignado.', o), error: (e) => this.err(e) });
      });
    });
  }

  anular() {
    this.dialog.open(AccionDialog, { width: '420px', data: { titulo: 'Anular orden', mensaje: 'La orden queda cerrada. Exige motivo.', confirmar: 'Anular', peligro: true, campos: [{ clave: 'motivo', label: 'Motivo', tipo: 'area', requerido: true }] } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.anular(this.id, String(v.motivo)).subscribe({ next: (o) => this.ok('Orden anulada.', o), error: (e) => this.err(e) });
      });
  }

  editarDatos() {
    const o = this.orden()!;
    this.dialog.open(AccionDialog, { width: '460px', data: { titulo: 'Diagnóstico y observaciones', confirmar: 'Guardar', campos: [
      { clave: 'kilometrajeIngreso', label: 'Kilometraje de ingreso', tipo: 'numero', valor: o.kilometrajeIngreso ?? '' },
      { clave: 'diagnostico', label: 'Diagnóstico', tipo: 'area', valor: o.diagnostico ?? '' },
      { clave: 'observaciones', label: 'Observaciones', tipo: 'area', valor: o.observaciones ?? '' },
    ] } }).afterClosed().subscribe((v) => {
      if (!v) return;
      this.api.actualizar(this.id, v).subscribe({ next: (o2) => this.ok('Actualizado.', o2), error: (e) => this.err(e) });
    });
  }

  agregarServicio() {
    this.maestros.servicios({ tamano: 100, activo: true }).subscribe((pg) => {
      this.dialog.open(AccionDialog, { width: '440px', data: { titulo: 'Agregar servicio', confirmar: 'Agregar', campos: [
        { clave: 'servicioId', label: 'Del catálogo (opcional)', tipo: 'select', valor: '',
          opciones: [{ valor: '', texto: 'Servicio suelto' }, ...pg.items.map((s) => ({ valor: s.id, texto: `${s.nombre} — S/ ${s.precio}` }))] },
        { clave: 'descripcion', label: 'Descripción (si es suelto)', tipo: 'texto' },
        { clave: 'precio', label: 'Precio (S/)', tipo: 'numero' },
        { clave: 'cantidad', label: 'Cantidad', tipo: 'numero', valor: 1, requerido: true },
      ] } }).afterClosed().subscribe((v) => {
        if (!v) return;
        if (v.servicioId === '') delete (v as Record<string, unknown>)['servicioId'];
        this.api.agregarServicio(this.id, v).subscribe({ next: (o) => this.ok('Servicio agregado.', o), error: (e) => this.err(e) });
      });
    });
  }

  quitarServicio(lineaId: number) {
    this.api.quitarServicio(this.id, lineaId).subscribe({ next: (o) => this.ok('Servicio quitado.', o), error: (e) => this.err(e) });
  }

  private buscarProducto = (q: string) =>
    this.maestros.productos({ buscar: q, tamano: 10, activo: true }).pipe(
      map((pg) => pg.items.map((p): OpcionBuscar => ({ valor: p.id, texto: p.nombre, sub: `${p.codigo} · stock ${p.stockTotal} ${p.unidad}` }))),
    );

  consumir() {
    this.maestros.sedes().subscribe((sedes) => {
      const activas = sedes.filter((s) => s.activo);
      this.dialog.open(AccionDialog, { width: '420px', data: { titulo: 'Consumir repuesto', mensaje: 'Descuenta del stock y lo registra en el kardex.', confirmar: 'Consumir', campos: [
        { clave: 'productoId', label: 'Producto', tipo: 'buscar', requerido: true, buscar: this.buscarProducto },
        { clave: 'sedeId', label: 'Sede', tipo: 'select', requerido: true, valor: activas[0]?.id ?? '', opciones: activas.map((s) => ({ valor: s.id, texto: s.nombre })) },
        { clave: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      ] } }).afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.consumir(this.id, v).subscribe({ next: (o) => this.ok('Repuesto consumido.', o), error: (e) => this.err(e) });
      });
    });
  }

  checklist() {
    this.dialog.open(ChecklistDialog, { width: '580px', maxWidth: '95vw', data: { respuestas: this.orden()?.checklist ?? [] } })
      .afterClosed().subscribe((filas) => {
        if (!filas) return;
        this.api.guardarChecklist(this.id, filas).subscribe({ next: (o) => this.ok('Checklist guardado.', o), error: (e) => this.err(e) });
      });
  }

  subir(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const lector = new FileReader();
    lector.onload = () => {
      const base64 = (lector.result as string).split(',')[1] ?? '';
      this.api.subirEvidencia(this.id, { tipo: 'FOTO', nombre: file.name, contenidoBase64: base64 }).subscribe({
        next: () => this.ok('Evidencia subida.'),
        error: (e) => this.err(e),
      });
    };
    lector.readAsDataURL(file);
    input.value = '';
  }

  descargar(evidenciaId: number, mime: string) {
    this.http.get(`${environment.apiUrl}/ordenes/${this.id}/evidencias/${evidenciaId}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(new Blob([blob], { type: mime }));
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: (e) => this.err(e),
    });
  }
}
