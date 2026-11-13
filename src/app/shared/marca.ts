import { Component, input } from '@angular/core';

/** El wordmark de LubriTech: "Lubri" en plata, "Tech" en rojo de marca. */
@Component({
  selector: 'lt-marca',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-2 font-extrabold tracking-tight" [style.fontSize]="tamano()">
      <span class="grid place-items-center rounded-lg bg-marca text-white shadow-marca"
            [style.width]="icono()" [style.height]="icono()">
        <svg viewBox="0 0 24 24" fill="none" [style.width]="iconoSvg()" [style.height]="iconoSvg()">
          <path d="M12 2l1.8 3.6 4 .6-2.9 2.8.7 4L12 14.8 8.4 13l.7-4L6.2 6.2l4-.6L12 2z"
                fill="currentColor" opacity=".95"/>
          <circle cx="12" cy="18.5" r="2.2" fill="currentColor"/>
        </svg>
      </span>
      <span class="text-texto">Lubri<span class="text-marca">Tech</span></span>
    </span>
  `,
})
export class Marca {
  /** Tamano del texto (ej. '1.5rem'). */
  tamano = input('1.35rem');
  icono = input('2rem');
  iconoSvg = input('1.25rem');
}
