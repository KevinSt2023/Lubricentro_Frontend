import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SesionService } from '../../core/sesion.service';
import { TableroTallerPanel } from './tablero-taller';

interface Acceso {
  ruta: string;
  texto: string;
  icono: string;
  desc: string;
  visible: () => boolean;
}

@Component({
  selector: 'lt-inicio',
  standalone: true,
  imports: [RouterLink, MatIconModule, TableroTallerPanel],
  template: `
    <div class="mb-8">
      <h1 class="text-2xl font-bold">{{ saludo() }}, {{ primerNombre() }}.</h1>
      <p class="text-texto-tenue mt-1">
        {{ sesion.esSuperAdmin() ? 'Consola del SaaS · dueño de la plataforma' : (sesion.perfil()?.empresa + ' · ' + sesion.perfil()?.rol) }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      @for (a of accesos(); track a.ruta) {
        <a [routerLink]="a.ruta"
           class="group rounded-2xl border border-borde bg-superficie p-5 hover:shadow-md
                  hover:border-marca/40 transition-all">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-11 h-11 rounded-xl bg-marca-soft text-marca
                         group-hover:bg-marca group-hover:text-white transition-colors">
              <mat-icon>{{ a.icono }}</mat-icon>
            </span>
            <div>
              <div class="font-semibold">{{ a.texto }}</div>
              <div class="text-xs text-texto-tenue">{{ a.desc }}</div>
            </div>
          </div>
        </a>
      }
    </div>

    @if (!sesion.esSuperAdmin() && sesion.puede('ORDENES.VER')) {
      <div class="mt-8">
        <h2 class="text-lg font-semibold mb-3">Tablero del taller</h2>
        <lt-tablero-taller />
      </div>
    }
  `,
})
export class Inicio {
  readonly sesion = inject(SesionService);

  readonly primerNombre = computed(() => (this.sesion.perfil()?.nombre ?? '').split(/\s+/)[0] ?? '');

  // Accesos del personal del taller (gated por permiso de empresa).
  private readonly taller: Acceso[] = [
    { ruta: '/ordenes', texto: 'Órdenes', icono: 'build', desc: 'Trabajos del taller', visible: () => this.sesion.puedeAlguno('ORDENES.VER', 'ORDENES.VER_ASIGNADAS') },
    { ruta: '/agenda', texto: 'Agenda', icono: 'calendar_month', desc: 'Citas del taller', visible: () => this.sesion.puede('AGENDA.VER') },
    { ruta: '/clientes', texto: 'Clientes', icono: 'people', desc: 'Dueños y flotas', visible: () => this.sesion.puede('CLIENTES.VER') },
    { ruta: '/vehiculos', texto: 'Vehículos', icono: 'directions_car', desc: 'Placas y mantenimiento', visible: () => this.sesion.puede('VEHICULOS.VER') },
    { ruta: '/almacen', texto: 'Almacén', icono: 'inventory_2', desc: 'Stock y kardex', visible: () => this.sesion.puede('ALMACEN.VER') },
    { ruta: '/servicios', texto: 'Servicios', icono: 'handyman', desc: 'Catálogo', visible: () => this.sesion.puede('SERVICIOS.VER') },
    { ruta: '/personal', texto: 'Personal', icono: 'badge', desc: 'El equipo', visible: () => this.sesion.puede('PERSONAL.VER') },
  ];

  // Accesos del dueño del SaaS: la logística de la plataforma, no un taller.
  private readonly consola: Acceso[] = [
    { ruta: '/sa/tablero', texto: 'Tablero del SaaS', icono: 'monitoring', desc: 'Ingresos, recurrencia y vencimientos', visible: () => true },
    { ruta: '/sa/empresas', texto: 'Empresas', icono: 'apartment', desc: 'Altas, suscripciones y cobranza', visible: () => true },
    { ruta: '/sa/planes', texto: 'Planes', icono: 'workspace_premium', desc: 'Funciones y cupos por plan', visible: () => true },
  ];

  readonly accesos = computed(() => {
    this.sesion.perfil();
    const lista = this.sesion.esSuperAdmin() ? this.consola : this.taller;
    return lista.filter((a) => a.visible());
  });

  saludo(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }
}
