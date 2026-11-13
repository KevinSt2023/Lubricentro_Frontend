import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Layout de la consola SuperAdmin: sub-navegación + contenido. */
@Component({
  selector: 'lt-consola',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Consola</h1>
      <p class="text-texto-tenue text-sm">Empresas, planes y cobranza del SaaS.</p>
    </div>

    <nav class="flex gap-1 mb-6 border-b border-borde">
      @for (t of tabs; track t.ruta) {
        <a [routerLink]="t.ruta" routerLinkActive="text-marca border-marca"
           class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-texto-tenue
                  border-b-2 border-transparent hover:text-texto transition-colors -mb-px">
          <mat-icon class="!w-5 !h-5 !text-[20px]">{{ t.icono }}</mat-icon>
          {{ t.texto }}
        </a>
      }
    </nav>

    <router-outlet />
  `,
})
export class Consola {
  tabs = [
    { ruta: 'tablero', texto: 'Tablero', icono: 'insights' },
    { ruta: 'empresas', texto: 'Empresas', icono: 'apartment' },
    { ruta: 'usuarios', texto: 'Usuarios', icono: 'group' },
    { ruta: 'planes', texto: 'Planes', icono: 'sell' },
  ];
}
