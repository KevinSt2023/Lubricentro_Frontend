import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaestrosService } from './maestros.service';
import { Producto, TIPOS_PRODUCTO, UNIDADES } from './maestros.models';
import { Pagina, ErrorApi } from '../../core/modelos';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { AlmacenDetalleDialog } from './almacen-detalle-dialog';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-almacen',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Almacén</h1>
        <p class="text-texto-tenue text-sm">Repuestos e insumos, con stock y kardex por sede.</p>
      </div>
      @if (sesion.puede('ALMACEN.INGRESAR')) {
        <button mat-flat-button color="primary" (click)="form()"><mat-icon>add</mat-icon> Nuevo producto</button>
      }
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <mat-form-field appearance="outline" class="!w-64" subscriptSizing="dynamic">
        <mat-icon matPrefix class="text-texto-tenue !ml-2">search</mat-icon>
        <input matInput placeholder="Nombre, código o barras" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="!w-44" subscriptSizing="dynamic">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="tipo" (selectionChange)="recargar()">
          <mat-option value="">Todos</mat-option>
          @for (t of tipos; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
        </mat-select>
      </mat-form-field>
      <mat-button-toggle-group [(ngModel)]="bajoMinimo" (change)="recargar()" class="!h-10">
        <mat-button-toggle [value]="false">Todos</mat-button-toggle>
        <mat-button-toggle [value]="true">Bajo mínimo</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    <div class="rounded-2xl border border-borde bg-superficie overflow-hidden">
      @if (cargando()) {
        <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
      } @else if (pagina(); as pg) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-texto-tenue text-xs uppercase border-b border-borde bg-superficie-2">
              <tr>
                <th class="text-left font-medium px-4 py-3">Producto</th>
                <th class="text-left font-medium px-4 py-3">Tipo</th>
                <th class="text-right font-medium px-4 py-3">Precio</th>
                <th class="text-right font-medium px-4 py-3">Stock</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (p of pg.items; track p.id) {
                <tr class="hover:bg-superficie-2 cursor-pointer" [class.opacity-50]="!p.activo" (click)="ver(p)">
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ p.nombre }}</div>
                    <div class="text-xs text-texto-tenue font-mono">{{ p.codigo }}</div>
                  </td>
                  <td class="px-4 py-3 text-texto-tenue">{{ p.tipo }}</td>
                  <td class="px-4 py-3 text-right">S/ {{ p.precioVenta | number: '1.2-2' }}</td>
                  <td class="px-4 py-3 text-right">
                    <span [class.text-marca]="p.bajoMinimo" [class.font-semibold]="p.bajoMinimo">
                      {{ p.stockTotal | number: '1.0-3' }} {{ p.unidad }}
                    </span>
                    @if (p.bajoMinimo) { <mat-icon class="!text-base text-marca align-middle ml-1">warning</mat-icon> }
                  </td>
                  <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                    <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
                    <mat-menu #m="matMenu">
                      <button mat-menu-item (click)="ver(p)"><mat-icon>visibility</mat-icon> Ver / mover stock</button>
                      @if (sesion.puede('ALMACEN.INGRESAR')) {
                        <button mat-menu-item (click)="form(p)"><mat-icon>edit</mat-icon> Editar</button>
                        <button mat-menu-item (click)="estado(p)"><mat-icon>{{ p.activo ? 'block' : 'check_circle' }}</mat-icon> {{ p.activo ? 'Desactivar' : 'Activar' }}</button>
                      }
                    </mat-menu>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="text-center text-texto-tenue py-10">No hay productos.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} producto(s)</span>
          <div class="flex items-center gap-2">
            <button mat-icon-button [disabled]="pg.paginaActual<=1" (click)="ir(pg.paginaActual-1)"><mat-icon>chevron_left</mat-icon></button>
            <span>{{ pg.paginaActual }} / {{ pg.totalPaginas||1 }}</span>
            <button mat-icon-button [disabled]="!pg.hayMas" (click)="ir(pg.paginaActual+1)"><mat-icon>chevron_right</mat-icon></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Almacen {
  readonly sesion = inject(SesionService);
  private api = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<Producto> | null>(null);
  readonly tipos = TIPOS_PRODUCTO;
  buscar = '';
  tipo = '';
  bajoMinimo = false;
  private pag = 1;

  constructor() { this.cargar(); }
  recargar() { this.pag = 1; this.cargar(); }
  ir(p: number) { this.pag = p; this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    this.api.productos({ pagina: this.pag, tamano: 15, buscar: this.buscar || undefined, tipo: this.tipo || undefined, bajoMinimo: this.bajoMinimo || undefined })
      .subscribe({ next: (pg) => { this.pagina.set(pg); this.cargando.set(false); }, error: () => this.cargando.set(false) });
  }
  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.cargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  ver(p: Producto) {
    this.dialog.open(AlmacenDetalleDialog, { width: '660px', maxWidth: '95vw', data: { productoId: p.id } })
      .afterClosed().subscribe(() => this.cargar());
  }

  form(p?: Producto) {
    const campos: CampoAccion[] = [
      { clave: 'codigo', label: 'Código', tipo: 'texto', requerido: true, valor: p?.codigo ?? '', grupo: 'Identificación', placeholder: 'ACE-15W40' },
      { clave: 'codigoBarras', label: 'Código de barras', tipo: 'texto', valor: p?.codigoBarras ?? '' },
      { clave: 'nombre', label: 'Nombre del producto', tipo: 'texto', requerido: true, valor: p?.nombre ?? '', col: 'full' },
      { clave: 'categoria', label: 'Categoría', tipo: 'texto', valor: p?.categoria ?? '', col: 'full' },
      { clave: 'tipo', label: 'Tipo', tipo: 'select', valor: p?.tipo ?? 'REPUESTO', grupo: 'Clasificación', opciones: TIPOS_PRODUCTO.map((t) => ({ valor: t, texto: t })) },
      { clave: 'unidad', label: 'Unidad', tipo: 'select', valor: p?.unidad ?? 'UND', opciones: UNIDADES.map((u) => ({ valor: u, texto: u })) },
      { clave: 'precioVenta', label: 'Precio de venta', tipo: 'numero', requerido: true, valor: p?.precioVenta ?? 0, grupo: 'Precio y stock', prefijo: 'S/', min: 0, step: 0.5 },
      { clave: 'stockMinimo', label: 'Stock mínimo', tipo: 'numero', valor: p?.stockMinimo ?? 0, min: 0, hint: 'Alerta bajo este nivel' },
    ];
    this.dialog.open(AccionDialog, { width: '560px', maxWidth: '95vw',
      data: { titulo: p ? 'Editar producto' : 'Nuevo producto', icono: 'inventory_2', confirmar: 'Guardar', campos } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        const obs = p ? this.api.editarProducto(p.id, v) : this.api.crearProducto(v);
        obs.subscribe({ next: () => this.ok('Producto guardado.'), error: (e) => this.err(e) });
      });
  }

  estado(p: Producto) {
    this.api.estadoProducto(p.id, !p.activo).subscribe({ next: () => this.ok(p.activo ? 'Desactivado.' : 'Activado.'), error: (e) => this.err(e) });
  }
}
