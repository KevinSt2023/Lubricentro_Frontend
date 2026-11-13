import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Observable, map } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaestrosService } from '../maestros/maestros.service';
import { Buscador, OpcionBuscar } from '../../shared/buscador';
import { CotizacionDetalle, GuardarCotizacion } from './cotizaciones.models';

interface Fila {
  tipo: 'SERVICIO' | 'REPUESTO';
  servicioId?: number;
  productoId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  buscar: (q: string) => Observable<OpcionBuscar[]>;
  cache: Map<number, { nombre: string; precio: number }>;
}

/** Arma o edita una cotización: renglones de servicio o repuesto, con buscador de catálogo. */
@Component({
  selector: 'lt-cotizacion-form-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, Buscador],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2.5 !mb-0 !pb-1">
      <span class="grid place-items-center w-9 h-9 rounded-xl bg-marca-soft text-marca shrink-0">
        <mat-icon class="!text-xl">request_quote</mat-icon>
      </span>
      <span class="text-lg font-semibold">{{ data.cotizacion ? 'Editar cotización v' + data.cotizacion.version : 'Nueva cotización' }}</span>
    </h2>
    <mat-dialog-content class="!min-w-[min(640px,94vw)] !max-h-[72vh]">
      <div class="pt-2 flex flex-col gap-4">
        @for (f of filas; track $index) {
          <div class="rounded-xl border border-borde p-3">
            <div class="flex items-end justify-between gap-2 mb-2">
              <div class="w-40">
                <label class="lt-label">Tipo</label>
                <select class="lt-input" [(ngModel)]="f.tipo" (ngModelChange)="limpiarRef(f)">
                  <option value="SERVICIO">Servicio</option>
                  <option value="REPUESTO">Repuesto</option>
                </select>
              </div>
              <button mat-icon-button (click)="quitar($index)" aria-label="Quitar renglón">
                <mat-icon>delete</mat-icon>
              </button>
            </div>

            <lt-buscador [label]="f.tipo === 'SERVICIO' ? 'Buscar servicio del catálogo' : 'Buscar repuesto del catálogo'"
                         placeholder="Escribe para buscar… (o deja la descripción libre)"
                         [buscar]="f.buscar" (seleccionado)="elegir(f, $event)" />

            <div class="flex flex-wrap gap-2 mt-2">
              <div class="flex-1 min-w-[12rem]">
                <label class="lt-label">Descripción</label>
                <input class="lt-input" [(ngModel)]="f.descripcion" />
              </div>
              <div class="w-20">
                <label class="lt-label">Cant.</label>
                <input class="lt-input" type="number" min="0" [(ngModel)]="f.cantidad" />
              </div>
              <div class="w-28">
                <label class="lt-label">Precio S/</label>
                <input class="lt-input" type="number" min="0" [(ngModel)]="f.precioUnitario" />
              </div>
              <div class="flex items-end pb-2.5 w-24 justify-end font-medium text-sm">
                S/ {{ (f.cantidad || 0) * (f.precioUnitario || 0) | number: '1.2-2' }}
              </div>
            </div>
          </div>
        }

        <button mat-stroked-button (click)="agregar()" class="self-start">
          <mat-icon>add</mat-icon> Agregar renglón
        </button>

        <div>
          <label class="lt-label">Nota para el cliente</label>
          <textarea class="lt-input" rows="2" [(ngModel)]="nota"></textarea>
        </div>
        <div class="w-56">
          <label class="lt-label">Válida hasta (opcional)</label>
          <input class="lt-input" type="date" [(ngModel)]="vigenciaHasta" />
        </div>

        @if (error) {
          <div class="flex items-center gap-2 text-marca text-sm rounded-lg bg-marca-soft px-3 py-2">
            <mat-icon class="!text-base">error_outline</mat-icon> {{ error }}
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-5 !pt-2 gap-1">
      <div class="mr-auto text-sm text-texto-tenue">Total: <b class="text-texto">S/ {{ total() | number: '1.2-2' }}</b></div>
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()">
        {{ data.cotizacion ? 'Guardar' : 'Crear borrador' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CotizacionFormDialog {
  private maestros = inject(MaestrosService);
  private ref = inject(MatDialogRef<CotizacionFormDialog>);
  readonly data = inject<{ ordenId: number; cotizacion?: CotizacionDetalle }>(MAT_DIALOG_DATA);

  filas: Fila[] = [];
  nota = '';
  vigenciaHasta = '';
  error = '';

  constructor() {
    const c = this.data.cotizacion;
    if (c) {
      this.nota = c.nota ?? '';
      this.vigenciaHasta = c.vigenciaHasta ?? '';
      this.filas = c.renglones.map((r) => this.nuevaFila({
        tipo: r.tipo, servicioId: r.servicioId, productoId: r.productoId,
        descripcion: r.descripcion, cantidad: r.cantidad, precioUnitario: r.precioUnitario,
      }));
    }
    if (this.filas.length === 0) this.agregar();
  }

  private nuevaFila(base?: Partial<Fila>): Fila {
    const f: Fila = {
      tipo: base?.tipo ?? 'SERVICIO',
      servicioId: base?.servicioId,
      productoId: base?.productoId,
      descripcion: base?.descripcion ?? '',
      cantidad: base?.cantidad ?? 1,
      precioUnitario: base?.precioUnitario ?? 0,
      cache: new Map(),
      buscar: (q: string) => this.buscar(f, q),
    };
    return f;
  }

  private buscar(f: Fila, q: string) {
    if (f.tipo === 'SERVICIO') {
      return this.maestros.servicios({ buscar: q, tamano: 10, activo: true }).pipe(
        map((pg) => pg.items.map((s): OpcionBuscar => {
          f.cache.set(s.id, { nombre: s.nombre, precio: s.precio });
          return { valor: s.id, texto: s.nombre, sub: `S/ ${s.precio}` };
        })),
      );
    }
    return this.maestros.productos({ buscar: q, tamano: 10, activo: true }).pipe(
      map((pg) => pg.items.map((p): OpcionBuscar => {
        f.cache.set(p.id, { nombre: p.nombre, precio: p.precioVenta });
        return { valor: p.id, texto: p.nombre, sub: `${p.codigo} · S/ ${p.precioVenta}` };
      })),
    );
  }

  agregar() { this.filas.push(this.nuevaFila()); }
  quitar(i: number) { this.filas.splice(i, 1); }

  limpiarRef(f: Fila) { f.servicioId = undefined; f.productoId = undefined; }

  elegir(f: Fila, o: OpcionBuscar | null) {
    if (!o) { this.limpiarRef(f); return; }
    if (f.tipo === 'SERVICIO') { f.servicioId = o.valor; f.productoId = undefined; }
    else { f.productoId = o.valor; f.servicioId = undefined; }
    const info = f.cache.get(o.valor);
    if (info) {
      if (!f.descripcion.trim()) f.descripcion = info.nombre;
      if (!f.precioUnitario) f.precioUnitario = info.precio;
    }
  }

  total(): number {
    return this.filas.reduce((s, f) => s + (f.cantidad || 0) * (f.precioUnitario || 0), 0);
  }

  confirmar() {
    const renglones = this.filas
      .filter((f) => f.descripcion.trim() || f.servicioId || f.productoId)
      .map((f) => ({
        tipo: f.tipo,
        servicioId: f.tipo === 'SERVICIO' ? f.servicioId : undefined,
        productoId: f.tipo === 'REPUESTO' ? f.productoId : undefined,
        descripcion: f.descripcion.trim() || undefined,
        cantidad: Number(f.cantidad) || 0,
        precioUnitario: f.precioUnitario === null ? undefined : Number(f.precioUnitario),
      }));

    if (renglones.length === 0) { this.error = 'Agrega al menos un renglón con descripción o ítem del catálogo.'; return; }
    if (renglones.some((r) => r.cantidad <= 0)) { this.error = 'Cada renglón necesita una cantidad mayor que cero.'; return; }

    const salida: GuardarCotizacion = {
      nota: this.nota.trim() || undefined,
      vigenciaHasta: this.vigenciaHasta || undefined,
      renglones,
    };
    this.ref.close(salida);
  }
}
