import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaestrosService } from './maestros.service';
import { Cliente, TIPOS_DOC } from './maestros.models';
import { Pagina, ErrorApi } from '../../core/modelos';
import { AccionDialog, CampoAccion } from '../../shared/accion-dialog';
import { ClaveDialog } from '../../shared/clave-dialog';
import { VehiculosDeDialog } from './vehiculos-de-dialog';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'lt-clientes',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold">Clientes</h1>
        <p class="text-texto-tenue text-sm">Particulares y empresas con flota.</p>
      </div>
      @if (sesion.puede('CLIENTES.CREAR')) {
        <button mat-flat-button color="primary" (click)="form()"><mat-icon>add</mat-icon> Nuevo cliente</button>
      }
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <mat-form-field appearance="outline" class="!w-64" subscriptSizing="dynamic">
        <mat-icon matPrefix class="text-texto-tenue !ml-2">search</mat-icon>
        <input matInput placeholder="Nombre, documento o teléfono" [(ngModel)]="buscar" (keyup.enter)="recargar()" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="!w-40" subscriptSizing="dynamic">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="tipo" (selectionChange)="recargar()">
          <mat-option value="">Todos</mat-option>
          <mat-option value="PARTICULAR">Particular</mat-option>
          <mat-option value="EMPRESA">Empresa</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="rounded-2xl border border-borde bg-superficie overflow-hidden">
      @if (cargando()) {
        <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
      } @else if (pagina(); as pg) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-texto-tenue text-xs uppercase border-b border-borde bg-superficie-2">
              <tr>
                <th class="text-left font-medium px-4 py-3">Cliente</th>
                <th class="text-left font-medium px-4 py-3">Documento</th>
                <th class="text-left font-medium px-4 py-3">Teléfono</th>
                <th class="text-center font-medium px-4 py-3">Vehículos</th>
                <th class="text-center font-medium px-4 py-3">Portal</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              @for (c of pg.items; track c.id) {
                <tr class="hover:bg-superficie-2" [class.opacity-50]="!c.activo">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <mat-icon class="!text-base" [class.text-marca]="c.tipo==='EMPRESA'">
                        {{ c.tipo==='EMPRESA' ? 'business' : 'person' }}
                      </mat-icon>
                      <span class="font-medium">{{ c.nombre }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-texto-tenue">{{ c.tipoDocumento }} {{ c.documento || '—' }}</td>
                  <td class="px-4 py-3 text-texto-tenue">{{ c.telefono || '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <button class="text-marca hover:underline" (click)="verVehiculos(c)">{{ c.vehiculos }}</button>
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (c.tienePortal) { <mat-icon class="!text-base text-emerald-500">verified_user</mat-icon> }
                    @else { <span class="text-texto-tenue text-xs">—</span> }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
                    <mat-menu #m="matMenu">
                      <button mat-menu-item (click)="verVehiculos(c)"><mat-icon>directions_car</mat-icon> Vehículos</button>
                      @if (sesion.puede('CLIENTES.EDITAR')) {
                        <button mat-menu-item (click)="form(c)"><mat-icon>edit</mat-icon> Editar</button>
                      }
                      @if (sesion.puede('CLIENTES.PORTAL') && sesion.tieneFuncion('APP_CLIENTES')) {
                        <button mat-menu-item (click)="portal(c)"><mat-icon>vpn_key</mat-icon> {{ c.tienePortal ? 'Reenviar portal' : 'Habilitar portal' }}</button>
                      }
                      @if (sesion.puede('CLIENTES.EDITAR')) {
                        <button mat-menu-item (click)="estado(c)">
                          <mat-icon>{{ c.activo ? 'block' : 'check_circle' }}</mat-icon> {{ c.activo ? 'Desactivar' : 'Activar' }}
                        </button>
                      }
                    </mat-menu>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="text-center text-texto-tenue py-10">No hay clientes.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-borde text-sm text-texto-tenue">
          <span>{{ pg.total }} cliente(s)</span>
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
export class Clientes {
  readonly sesion = inject(SesionService);
  private api = inject(MaestrosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly pagina = signal<Pagina<Cliente> | null>(null);
  buscar = '';
  tipo = '';
  private pag = 1;

  constructor() { this.cargar(); }

  recargar() { this.pag = 1; this.cargar(); }
  ir(p: number) { this.pag = p; this.cargar(); }

  private cargar() {
    this.cargando.set(true);
    this.api.clientes({ pagina: this.pag, tamano: 15, buscar: this.buscar || undefined, tipo: this.tipo || undefined })
      .subscribe({ next: (pg) => { this.pagina.set(pg); this.cargando.set(false); }, error: () => this.cargando.set(false) });
  }

  private ok(m: string) { this.snack.open(m, 'OK', { duration: 3000 }); this.cargar(); }
  private err(e: unknown) { this.snack.open((e as { error?: ErrorApi })?.error?.mensaje ?? 'No se pudo.', 'Cerrar', { duration: 5000 }); }

  form(c?: Cliente) {
    const empresa = (c?.tipo ?? 'PARTICULAR') === 'EMPRESA';
    const campos: CampoAccion[] = [
      { clave: 'tipo', label: 'Tipo', tipo: 'select', requerido: true, valor: c?.tipo ?? 'PARTICULAR', grupo: 'Identificación',
        opciones: [{ valor: 'PARTICULAR', texto: 'Particular' }, { valor: 'EMPRESA', texto: 'Empresa' }] },
      { clave: 'tipoDocumento', label: 'Tipo de documento', tipo: 'select', valor: c?.tipoDocumento ?? 'DNI',
        opciones: TIPOS_DOC.map((t) => ({ valor: t, texto: t })) },
      { clave: 'documento', label: 'Número de documento', tipo: 'texto', valor: c?.documento ?? '', placeholder: 'DNI 8 díg. · RUC 11 díg.', col: 'full' },
      { clave: 'nombres', label: 'Nombres', tipo: 'texto', grupo: 'Datos del cliente', hint: empresa ? 'Solo para particular' : undefined },
      { clave: 'apellidos', label: 'Apellidos', tipo: 'texto' },
      { clave: 'razonSocial', label: 'Razón social', tipo: 'texto', col: 'full', hint: empresa ? undefined : 'Solo para empresa' },
      { clave: 'telefono', label: 'Teléfono', tipo: 'texto', valor: c?.telefono ?? '', grupo: 'Contacto' },
      { clave: 'email', label: 'Correo', tipo: 'texto', valor: c?.email ?? '', placeholder: 'correo@dominio.pe' },
      { clave: 'direccion', label: 'Dirección', tipo: 'texto', col: 'full' },
    ];
    this.dialog.open(AccionDialog, { width: '580px', maxWidth: '95vw',
      data: { titulo: c ? 'Editar cliente' : 'Nuevo cliente', icono: 'person', confirmar: 'Guardar', campos } })
      .afterClosed().subscribe((v) => {
        if (!v) return;
        const obs = c ? this.api.editarCliente(c.id, v) : this.api.crearCliente(v);
        obs.subscribe({ next: () => this.ok('Cliente guardado.'), error: (e) => this.err(e) });
      });
  }

  portal(c: Cliente) {
    this.api.habilitarPortal(c.id).subscribe({
      next: (r) => { this.dialog.open(ClaveDialog, { width: '440px', data: { titulo: 'Portal habilitado', email: r.email, clave: r.claveTemporal } }); this.cargar(); },
      error: (e) => this.err(e),
    });
  }

  estado(c: Cliente) {
    this.api.estadoCliente(c.id, !c.activo).subscribe({ next: () => this.ok(c.activo ? 'Cliente desactivado.' : 'Cliente activado.'), error: (e) => this.err(e) });
  }

  verVehiculos(c: Cliente) {
    this.dialog.open(VehiculosDeDialog, { width: '560px', maxWidth: '95vw', data: { clienteId: c.id, nombre: c.nombre } });
  }
}
