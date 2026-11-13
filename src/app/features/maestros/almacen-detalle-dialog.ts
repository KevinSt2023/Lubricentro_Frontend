import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaestrosService } from './maestros.service';
import { MovimientoKardex, ProductoDetalle, SedeSimple } from './maestros.models';
import { Pagina, ErrorApi } from '../../core/modelos';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { SesionService } from '../../core/sesion.service';

export interface AlmacenDetalleData {
  productoId: number;
}

/** Ficha de un producto: stock por sede, kardex, y acciones de ingreso/ajuste. */
@Component({
  selector: 'lt-almacen-detalle-dialog',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule,
  ],
  template: `
    @if (producto(); as p) {
      <h2 mat-dialog-title class="!flex items-center gap-2">
        <mat-icon class="text-marca">inventory_2</mat-icon> {{ p.nombre }}
        <span class="text-sm text-texto-tenue font-normal">· {{ p.codigo }}</span>
      </h2>
      <mat-dialog-content class="!min-w-[min(620px,92vw)]">
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <div><span class="text-texto-tenue text-sm">Stock total</span>
            <div class="text-2xl font-bold" [class.text-marca]="p.bajoMinimo">{{ p.stockTotal | number: '1.0-3' }} {{ p.unidad }}</div></div>
          <div><span class="text-texto-tenue text-sm">Precio venta</span>
            <div class="text-lg font-semibold">S/ {{ p.precioVenta | number: '1.2-2' }}</div></div>
          <div><span class="text-texto-tenue text-sm">Mínimo</span>
            <div class="text-lg font-semibold">{{ p.stockMinimo | number: '1.0-3' }}</div></div>
          <span class="flex-1"></span>
          @if (sesion.puede('ALMACEN.INGRESAR')) {
            <button mat-flat-button color="primary" (click)="ingresar(p)"><mat-icon>add</mat-icon> Ingreso</button>
          }
          @if (sesion.puede('ALMACEN.AJUSTAR')) {
            <button mat-stroked-button (click)="ajustar(p)"><mat-icon>tune</mat-icon> Ajuste</button>
          }
        </div>

        <mat-tab-group>
          <mat-tab label="Stock por sede">
            <ul class="divide-y divide-borde mt-2">
              @for (s of p.stock; track s.sedeId) {
                <li class="py-3 flex items-center justify-between">
                  <span class="font-medium">{{ s.sede }}</span>
                  <div class="text-right">
                    <div class="font-semibold">{{ s.cantidad | number: '1.0-3' }} {{ p.unidad }}</div>
                    @if (sesion.puede('ALMACEN.COSTOS')) {
                      <div class="text-xs text-texto-tenue">costo S/ {{ s.costoPromedio | number: '1.2-4' }}</div>
                    }
                  </div>
                </li>
              } @empty {
                <li class="py-6 text-center text-texto-tenue text-sm">Sin stock en ninguna sede.</li>
              }
            </ul>
          </mat-tab>

          <mat-tab label="Kardex">
            @if (cargandoKardex()) {
              <div class="grid place-items-center py-8"><mat-spinner diameter="28" /></div>
            } @else {
              <div class="overflow-x-auto mt-2">
                <table class="w-full text-sm">
                  <thead class="text-texto-tenue text-xs uppercase border-b border-borde">
                    <tr>
                      <th class="text-left font-medium py-2">Fecha</th>
                      <th class="text-left font-medium py-2">Tipo</th>
                      <th class="text-right font-medium py-2">Cantidad</th>
                      <th class="text-right font-medium py-2">Saldo</th>
                      <th class="text-left font-medium py-2 pl-3">Ref.</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-borde">
                    @for (k of kardex()?.items ?? []; track k.id) {
                      <tr>
                        <td class="py-2 text-texto-tenue">{{ k.creadoEn | date: 'dd/MM/yy HH:mm' }}</td>
                        <td class="py-2">
                          <span class="text-xs px-2 py-0.5 rounded-full"
                                [class]="esIngreso(k.tipo) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-marca-soft text-marca'">
                            {{ k.tipo }}
                          </span>
                        </td>
                        <td class="py-2 text-right" [class.text-emerald-600]="esIngreso(k.tipo)" [class.text-marca]="!esIngreso(k.tipo)">
                          {{ esIngreso(k.tipo) ? '+' : '−' }}{{ k.cantidad | number: '1.0-3' }}
                        </td>
                        <td class="py-2 text-right font-medium">{{ k.saldo | number: '1.0-3' }}</td>
                        <td class="py-2 pl-3 text-texto-tenue">{{ k.referencia || k.motivo || '—' }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="text-center text-texto-tenue py-6">Sin movimientos.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
      </mat-dialog-actions>
    } @else {
      <div class="grid place-items-center p-10"><mat-spinner diameter="36" /></div>
    }
  `,
})
export class AlmacenDetalleDialog {
  readonly data = inject<AlmacenDetalleData>(MAT_DIALOG_DATA);
  readonly sesion = inject(SesionService);
  private api = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly producto = signal<ProductoDetalle | null>(null);
  readonly kardex = signal<Pagina<MovimientoKardex> | null>(null);
  readonly cargandoKardex = signal(true);
  private sedes: SedeSimple[] = [];

  constructor() {
    this.api.sedes().subscribe((s) => (this.sedes = s.filter((x) => x.activo)));
    this.recargar();
  }

  esIngreso(tipo: string) { return tipo === 'INGRESO' || tipo === 'AJUSTE_POS'; }

  private recargar() {
    this.api.producto(this.data.productoId).subscribe((p) => this.producto.set(p));
    this.cargandoKardex.set(true);
    this.api.kardex(this.data.productoId, 1, 50).subscribe({
      next: (k) => { this.kardex.set(k); this.cargandoKardex.set(false); },
      error: () => this.cargandoKardex.set(false),
    });
  }

  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.recargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  private sedeCampo(): CampoAccion {
    return { clave: 'sedeId', label: 'Sede', tipo: 'select', requerido: true,
      valor: this.sedes[0]?.id ?? '', opciones: this.sedes.map((s) => ({ valor: s.id, texto: s.nombre })) };
  }

  ingresar(p: ProductoDetalle) {
    this.dialog.open(AccionDialog, { width: '400px',
      data: { titulo: 'Ingreso de mercadería', confirmar: 'Ingresar', campos: [
        this.sedeCampo(),
        { clave: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
        { clave: 'costoUnitario', label: 'Costo unitario (S/)', tipo: 'numero', requerido: true, valor: 0 },
        { clave: 'referencia', label: 'Referencia / factura', tipo: 'texto' },
      ] } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.ingresar(p.id, v).subscribe({ next: () => this.ok('Ingreso registrado.'), error: (e) => this.err(e) });
      });
  }

  ajustar(p: ProductoDetalle) {
    this.dialog.open(AccionDialog, { width: '400px',
      data: { titulo: 'Ajuste de inventario', mensaje: 'Deja el stock de la sede en lo contado. Exige motivo.', confirmar: 'Ajustar', campos: [
        this.sedeCampo(),
        { clave: 'cantidadReal', label: 'Cantidad contada', tipo: 'numero', requerido: true },
        { clave: 'motivo', label: 'Motivo', tipo: 'area', requerido: true },
      ] } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        this.api.ajustar(p.id, v).subscribe({ next: () => this.ok('Ajuste aplicado.'), error: (e) => this.err(e) });
      });
  }
}
