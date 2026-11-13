import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SesionService } from '../core/sesion.service';
import { TemaService } from '../core/tema.service';
import { Marca } from '../shared/marca';

interface ItemMenu {
  ruta: string;
  texto: string;
  icono: string;
  visible: () => boolean;
}

@Component({
  selector: 'lt-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    Marca,
  ],
  template: `
    <div class="min-h-screen bg-fondo text-texto">
      <!-- Fondo oscuro del drawer en movil -->
      @if (abierto()) {
        <div class="fixed inset-0 z-30 bg-black/50 lg:hidden" (click)="abierto.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside
        class="fixed z-40 inset-y-0 left-0 w-64 bg-grafito-900 text-plata flex flex-col
               transition-transform duration-200 lg:translate-x-0"
        [class.-translate-x-full]="!abierto()"
      >
        <div class="h-16 flex items-center px-5 border-b border-white/5">
          <lt-marca tamano="1.25rem" icono="1.9rem" iconoSvg="1.1rem" />
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          @for (item of visibles(); track item.ruta) {
            <a
              [routerLink]="item.ruta"
              routerLinkActive="bg-marca text-white shadow-marca"
              [routerLinkActiveOptions]="{ exact: item.ruta === '/inicio' }"
              (click)="abierto.set(false)"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-plata/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <mat-icon class="!w-5 !h-5 !text-[20px]">{{ item.icono }}</mat-icon>
              {{ item.texto }}
            </a>
          }
        </nav>

        <div class="p-3 border-t border-white/5 text-xs text-plata/40">
          {{ sesion.esSuperAdmin() ? 'Consola del SaaS' : (sesion.perfil()?.empresa ?? 'LubriTech') }}
        </div>
      </aside>

      <!-- Columna principal -->
      <div class="lg:pl-64">
        <!-- Topbar -->
        <header
          class="h-16 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6
                 bg-superficie/80 backdrop-blur border-b border-borde"
        >
          <button mat-icon-button class="lg:!hidden" (click)="abierto.set(true)" aria-label="Menú">
            <mat-icon>menu</mat-icon>
          </button>

          <div class="flex-1"></div>

          <div class="flex items-center gap-1">
            <button mat-icon-button (click)="tema.alternar()"
                    [matTooltip]="tema.tema() === 'dark' ? 'Modo claro' : 'Modo oscuro'">
              <mat-icon>{{ tema.tema() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <button mat-button [matMenuTriggerFor]="menu" class="!rounded-full !px-2">
              <span class="grid place-items-center w-8 h-8 rounded-full bg-marca text-white text-sm font-bold">
                {{ iniciales() }}
              </span>
              <span class="hidden sm:inline ml-2 text-sm font-medium max-w-[12rem] truncate">
                {{ sesion.perfil()?.nombre }}
              </span>
              <mat-icon class="!text-base">arrow_drop_down</mat-icon>
            </button>

            <mat-menu #menu="matMenu">
              <div class="px-4 py-3 border-b border-borde">
                <div class="font-semibold text-sm">{{ sesion.perfil()?.nombre }}</div>
                <div class="text-xs text-texto-tenue">{{ sesion.perfil()?.rol }}</div>
                <div class="text-xs text-texto-tenue">{{ sesion.perfil()?.email }}</div>
              </div>
              <button mat-menu-item (click)="salir()">
                <mat-icon>logout</mat-icon>
                <span>Cerrar sesión</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Contenido -->
        <main class="p-4 lg:p-6 max-w-[1400px] mx-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  readonly sesion = inject(SesionService);
  readonly tema = inject(TemaService);

  readonly abierto = signal(false);

  private readonly items: ItemMenu[] = [
    { ruta: '/inicio', texto: 'Inicio', icono: 'dashboard', visible: () => true },
    { ruta: '/ordenes', texto: 'Órdenes', icono: 'build', visible: () => this.sesion.puedeAlguno('ORDENES.VER', 'ORDENES.VER_ASIGNADAS') },
    { ruta: '/clientes', texto: 'Clientes', icono: 'people', visible: () => this.sesion.puede('CLIENTES.VER') },
    { ruta: '/vehiculos', texto: 'Vehículos', icono: 'directions_car', visible: () => this.sesion.puede('VEHICULOS.VER') },
    { ruta: '/almacen', texto: 'Almacén', icono: 'inventory_2', visible: () => this.sesion.puede('ALMACEN.VER') },
    { ruta: '/servicios', texto: 'Servicios', icono: 'handyman', visible: () => this.sesion.puede('SERVICIOS.VER') },
    { ruta: '/personal', texto: 'Personal', icono: 'badge', visible: () => this.sesion.puede('PERSONAL.VER') },
    { ruta: '/sa', texto: 'Consola', icono: 'admin_panel_settings', visible: () => this.sesion.esSuperAdmin() },
  ];

  readonly visibles = computed(() => {
    this.sesion.perfil();
    return this.items.filter((i) => i.visible());
  });

  readonly iniciales = computed(() => {
    const n = this.sesion.perfil()?.nombre ?? '';
    const partes = n.trim().split(/\s+/);
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'LT';
  });

  salir(): void {
    this.sesion.salir();
    location.href = '/ingresar';
  }
}
