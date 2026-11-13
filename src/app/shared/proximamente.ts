import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Marcador de un modulo cuya pantalla aun no se construye. */
@Component({
  selector: 'lt-proximamente',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="min-h-[60vh] grid place-items-center">
      <div class="text-center max-w-sm">
        <span class="grid place-items-center w-16 h-16 rounded-2xl bg-marca-soft text-marca mx-auto">
          <mat-icon class="!w-8 !h-8 !text-3xl">{{ icono }}</mat-icon>
        </span>
        <h2 class="mt-4 text-xl font-bold">{{ titulo }}</h2>
        <p class="mt-2 text-texto-tenue text-sm">
          Esta pantalla está en construcción. El backend ya está listo y probado;
          la interfaz llega en la siguiente entrega.
        </p>
      </div>
    </div>
  `,
})
export class Proximamente {
  private route = inject(ActivatedRoute);
  titulo = this.route.snapshot.data['titulo'] ?? 'Próximamente';
  icono = this.route.snapshot.data['icono'] ?? 'construction';
}
