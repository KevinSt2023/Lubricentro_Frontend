import { Injectable, signal } from '@angular/core';

type Tema = 'light' | 'dark';
const LLAVE = 'lt-tema';

/** Modo claro/oscuro global. Arranca en oscuro (la marca es oscura). */
@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly tema = signal<Tema>(this.leer());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar(): void {
    const siguiente: Tema = this.tema() === 'dark' ? 'light' : 'dark';
    this.tema.set(siguiente);
    this.aplicar(siguiente);
    try {
      localStorage.setItem(LLAVE, siguiente);
    } catch {
      /* nada */
    }
  }

  private aplicar(t: Tema): void {
    document.documentElement.setAttribute('data-theme', t);
  }

  private leer(): Tema {
    try {
      return (localStorage.getItem(LLAVE) as Tema) || 'dark';
    } catch {
      return 'dark';
    }
  }
}
