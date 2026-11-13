import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgendaService } from './agenda.service';
import { AgendaCita, ProximoMantenimiento } from './agenda.models';
import { CitaFormDialog } from './cita-form-dialog';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { MaestrosService } from '../maestros/maestros.service';
import { Personal, SedeSimple } from '../maestros/maestros.models';
import { SesionService } from '../../core/sesion.service';
import { ErrorApi } from '../../core/modelos';

/** La agenda del taller: calendario semanal de citas, por sede y técnico. */
@Component({
  selector: 'lt-agenda',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Agenda</h1>
        <p class="text-texto-tenue text-sm">
          {{ citas().length }} cita(s) esta semana · recepción con un clic al llegar.
        </p>
      </div>
      @if (sesion.puede('AGENDA.AGENDAR')) {
        <button mat-flat-button color="primary" (click)="nueva()"><mat-icon>add</mat-icon> Nueva cita</button>
      }
    </div>

    <!-- Controles -->
    <div class="flex flex-wrap items-center gap-3 mb-4 rounded-2xl border border-borde bg-superficie px-3 py-2.5">
      <div class="flex items-center gap-1">
        <button mat-icon-button (click)="mover(-1)" aria-label="Semana anterior"><mat-icon>chevron_left</mat-icon></button>
        <button mat-stroked-button class="!h-9 !px-4" (click)="hoy()">Hoy</button>
        <button mat-icon-button (click)="mover(1)" aria-label="Semana siguiente"><mat-icon>chevron_right</mat-icon></button>
      </div>
      <span class="font-semibold tabular">{{ rangoLabel() }}</span>

      <span class="flex-1"></span>

      <select class="lt-input !w-48" [(ngModel)]="sedeId" (change)="recargar()">
        <option [ngValue]="0">Todas las sedes</option>
        @for (s of sedes(); track s.id) { <option [ngValue]="s.id">{{ s.nombre }}</option> }
      </select>
      <select class="lt-input !w-48" [(ngModel)]="tecnicoId" (change)="recargar()">
        <option [ngValue]="0">Todos los técnicos</option>
        @for (t of tecnicos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
      </select>
    </div>

    <!-- Calendario semanal -->
    @if (cargando()) {
      <div class="grid place-items-center py-20"><mat-spinner diameter="40" /></div>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-7 gap-3">
        @for (d of dias(); track d) {
          <div class="rounded-2xl border bg-superficie overflow-hidden flex flex-col"
               [class.border-borde]="!esHoy(d)" [class.border-marca]="esHoy(d)">
            <!-- Cabecera del día -->
            <div class="px-3 py-2 border-b border-borde text-center" [class.bg-marca-soft]="esHoy(d)">
              <div class="text-[0.68rem] uppercase tracking-wide text-texto-tenue">{{ diaNombre(d) }}</div>
              <div class="text-lg font-bold tabular" [class.text-marca]="esHoy(d)">{{ diaNumero(d) }}</div>
            </div>
            <!-- Citas del día -->
            <div class="p-2 flex flex-col gap-2 grow min-h-[7rem]">
              @for (c of citasDe(d); track c.id) {
                <div class="rounded-xl border border-borde bg-superficie-2 p-2.5 hover:border-marca/40 transition-colors">
                  <div class="flex items-start justify-between gap-1">
                    <span class="text-sm font-bold tabular leading-none mt-0.5">{{ c.fechaCita | date: 'HH:mm' : '-0500' }}</span>
                    @if (sesion.puede('AGENDA.AGENDAR')) {
                      <button mat-icon-button class="!w-7 !h-7 !leading-none -mr-1 -mt-1" [matMenuTriggerFor]="m">
                        <mat-icon class="!text-lg">more_vert</mat-icon>
                      </button>
                      <mat-menu #m="matMenu">
                        <button mat-menu-item (click)="recibir(c)"><mat-icon>login</mat-icon> Recibir vehículo</button>
                        <button mat-menu-item (click)="reprogramar(c)"><mat-icon>edit_calendar</mat-icon> Reprogramar</button>
                        <button mat-menu-item (click)="cancelar(c)"><mat-icon>event_busy</mat-icon> Cancelar cita</button>
                      </mat-menu>
                    }
                  </div>
                  <div class="font-mono text-[0.7rem] text-texto-tenue mt-1">{{ c.placa }}</div>
                  <div class="text-sm font-medium leading-tight truncate">{{ c.vehiculo }}</div>
                  <div class="text-xs text-texto-tenue truncate">{{ c.cliente }}</div>
                  @if (c.tecnico) {
                    <div class="mt-1.5 inline-flex items-center gap-1 text-[0.7rem] px-1.5 py-0.5 rounded-full bg-acero-400/15 text-texto">
                      <mat-icon class="!text-sm !w-3.5 !h-3.5">engineering</mat-icon>{{ c.tecnico }}
                    </div>
                  }
                  @if (c.motivo) {
                    <div class="text-xs text-texto-tenue mt-1.5 line-clamp-2">{{ c.motivo }}</div>
                  }
                </div>
              } @empty {
                @if (sesion.puede('AGENDA.AGENDAR')) {
                  <button (click)="nueva(d)"
                          class="grid place-items-center py-5 rounded-xl border border-dashed border-borde text-texto-tenue hover:border-marca/40 hover:text-marca transition-colors">
                    <mat-icon class="!text-lg">add</mat-icon>
                  </button>
                } @else {
                  <div class="grid place-items-center py-6 text-texto-tenue text-xs">—</div>
                }
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Próximos mantenimientos -->
    @if (mantenimientos().length) {
      <div class="mt-6 rounded-2xl border border-borde bg-superficie overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-borde bg-superficie-2/50">
          <div class="flex items-center gap-2">
            <mat-icon class="text-amber-500 !text-xl">notifications_active</mat-icon>
            <h3 class="text-sm font-semibold">Próximos mantenimientos</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-superficie-2 border border-borde text-texto-tenue">{{ mantenimientos().length }}</span>
          </div>
          <span class="text-xs text-texto-tenue">Vencidos y por vencer — llama antes de que toque</span>
        </div>
        <div class="divide-y divide-borde">
          @for (m of mantenimientos(); track m.vehiculoId) {
            <div class="flex items-center gap-3 px-4 py-2.5 hover:bg-superficie-2 transition-colors">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs px-1.5 py-0.5 rounded bg-superficie-2 border border-borde">{{ m.placa }}</span>
                  <span class="font-medium truncate">{{ m.vehiculo }}</span>
                </div>
                <div class="text-xs text-texto-tenue truncate">{{ m.cliente }}</div>
              </div>

              <div class="text-right shrink-0 w-40">
                @if (m.vencido) {
                  <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-marca-soft text-marca font-medium">Vencido</span>
                } @else {
                  <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">Por vencer</span>
                }
                <div class="text-[0.7rem] text-texto-tenue mt-0.5 tabular">{{ detalleRestante(m) }}</div>
              </div>

              @if (m.telefono) {
                <a [href]="'tel:' + m.telefono" class="grid place-items-center w-9 h-9 rounded-lg border border-borde text-texto-tenue hover:text-marca hover:border-marca/40 transition-colors shrink-0" [title]="'Llamar a ' + m.cliente">
                  <mat-icon class="!text-lg">call</mat-icon>
                </a>
              }
              @if (sesion.puede('AGENDA.AGENDAR')) {
                <button mat-stroked-button class="!h-9 !text-xs shrink-0" (click)="agendarDe(m)">
                  <mat-icon class="!text-base">event</mat-icon> Agendar
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class Agenda {
  readonly sesion = inject(SesionService);
  private api = inject(AgendaService);
  private maestros = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly citas = signal<AgendaCita[]>([]);
  readonly mantenimientos = signal<ProximoMantenimiento[]>([]);
  readonly sedes = signal<SedeSimple[]>([]);
  readonly tecnicos = signal<Personal[]>([]);
  readonly semana = signal(0);

  sedeId = 0;
  tecnicoId = 0;

  private readonly DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  private readonly MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

  /** Los 7 días (yyyy-mm-dd, en Lima) de la semana visible, de lunes a domingo. */
  readonly dias = computed(() => {
    const lunes = this.sumarDias(this.lunesDe(this.limaHoy()), this.semana() * 7);
    return Array.from({ length: 7 }, (_, i) => this.sumarDias(lunes, i));
  });

  readonly rangoLabel = computed(() => {
    const ds = this.dias();
    const a = this.fechaUtc(ds[0]), b = this.fechaUtc(ds[6]);
    const mesA = this.MESES[a.getUTCMonth()], mesB = this.MESES[b.getUTCMonth()];
    return mesA === mesB
      ? `${a.getUTCDate()} – ${b.getUTCDate()} ${mesB} ${b.getUTCFullYear()}`
      : `${a.getUTCDate()} ${mesA} – ${b.getUTCDate()} ${mesB} ${b.getUTCFullYear()}`;
  });

  constructor() {
    this.maestros.sedes().subscribe((s) => this.sedes.set(s.filter((x) => x.activo)));
    this.maestros.personal({ rolId: 6, activo: true, tamano: 100 }).subscribe((pg) => this.tecnicos.set(pg.items));
    this.cargar();
    this.cargarMant();
  }

  private cargarMant() {
    this.api.proximosMantenimientos().subscribe({ next: (m) => this.mantenimientos.set(m), error: () => {} });
  }

  detalleRestante(m: ProximoMantenimiento): string {
    const p: string[] = [];
    if (m.diasRestantes != null) p.push(m.diasRestantes < 0 ? `${-m.diasRestantes}d vencido` : `en ${m.diasRestantes}d`);
    if (m.kmRestantes != null) p.push(m.kmRestantes < 0 ? `${(-m.kmRestantes).toLocaleString()} km pasado` : `en ${m.kmRestantes.toLocaleString()} km`);
    return p.join(' · ');
  }

  agendarDe(m: ProximoMantenimiento) {
    this.dialog.open(CitaFormDialog, { width: '520px', maxWidth: '95vw',
      data: { modo: 'crear', sedeId: this.sedeId || undefined,
        preVehiculo: { vehiculoId: m.vehiculoId, clienteId: m.clienteId, placa: m.placa, vehiculo: m.vehiculo, cliente: m.cliente } } })
      .afterClosed().subscribe((b) => {
        if (!b) return;
        this.api.agendar(b).subscribe({ next: () => this.ok('Cita agendada.'), error: (e) => this.err(e) });
      });
  }

  // --- Eje de tiempo (todo en Lima, -05:00) ---
  private limaHoy(): string { return new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); }
  private fechaUtc(f: string): Date { return new Date(f + 'T00:00:00Z'); }
  private sumarDias(f: string, n: number): string {
    const d = this.fechaUtc(f); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
  }
  private lunesDe(f: string): string {
    const d = this.fechaUtc(f); const dow = d.getUTCDay();
    return this.sumarDias(f, dow === 0 ? -6 : 1 - dow);
  }
  private limaDiaDe(iso: string): string { return new Date(new Date(iso).getTime() - 5 * 3600e3).toISOString().slice(0, 10); }

  esHoy(f: string): boolean { return f === this.limaHoy(); }
  diaNombre(f: string): string { return this.DOW[this.fechaUtc(f).getUTCDay()]; }
  diaNumero(f: string): number { return this.fechaUtc(f).getUTCDate(); }

  citasDe(f: string): AgendaCita[] {
    return this.citas()
      .filter((c) => this.limaDiaDe(c.fechaCita) === f)
      .sort((a, b) => a.fechaCita.localeCompare(b.fechaCita));
  }

  mover(n: number) { this.semana.update((s) => s + n); this.cargar(); }
  hoy() { this.semana.set(0); this.cargar(); }
  recargar() { this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    const ds = this.dias();
    this.api.listar({
      desde: `${ds[0]}T00:00:00-05:00`,
      hasta: `${ds[6]}T23:59:59-05:00`,
      sedeId: this.sedeId || undefined,
      tecnicoId: this.tecnicoId || undefined,
    }).subscribe({
      next: (cs) => { this.citas.set(cs); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.cargar(); this.cargarMant(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  nueva(dia?: string) {
    this.dialog.open(CitaFormDialog, { width: '520px', maxWidth: '95vw',
      data: { modo: 'crear', fecha: dia, sedeId: this.sedeId || undefined } })
      .afterClosed().subscribe((b) => {
        if (!b) return;
        this.api.agendar(b).subscribe({ next: () => this.ok('Cita agendada.'), error: (e) => this.err(e) });
      });
  }

  reprogramar(c: AgendaCita) {
    this.dialog.open(CitaFormDialog, { width: '520px', maxWidth: '95vw', data: { modo: 'reprogramar', cita: c } })
      .afterClosed().subscribe((b) => {
        if (!b) return;
        this.api.reprogramar(c.id, b).subscribe({ next: () => this.ok('Cita reprogramada.'), error: (e) => this.err(e) });
      });
  }

  recibir(c: AgendaCita) {
    const campos: CampoAccion[] = [
      { clave: 'kilometrajeIngreso', label: 'Kilometraje de ingreso', tipo: 'numero', min: 0, hint: 'Opcional' },
    ];
    this.dialog.open(AccionDialog, { width: '400px',
      data: { titulo: 'Recibir vehículo', icono: 'login',
        mensaje: `${c.placa} · ${c.vehiculo}. La cita pasa a Recibido.`, confirmar: 'Recibir', campos } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.recibir(c.id, v.kilometrajeIngreso ? Number(v.kilometrajeIngreso) : undefined)
          .subscribe({ next: () => this.ok('Vehículo recibido.'), error: (e) => this.err(e) });
      });
  }

  cancelar(c: AgendaCita) {
    this.dialog.open(AccionDialog, { width: '420px',
      data: { titulo: 'Cancelar cita', icono: 'event_busy', peligro: true,
        mensaje: `${c.placa} · ${c.cliente}. Esta acción anula la cita.`, confirmar: 'Cancelar cita',
        campos: [{ clave: 'motivo', label: 'Motivo', tipo: 'area', requerido: true, placeholder: 'Por qué se cancela…' }] } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.cancelar(c.id, v.motivo).subscribe({ next: () => this.ok('Cita cancelada.'), error: (e) => this.err(e) });
      });
  }
}
