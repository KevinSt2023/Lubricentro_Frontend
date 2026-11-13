import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ClaveData {
  titulo: string;
  email?: string;
  clave: string;
}

/** Muestra una clave temporal UNA vez, con botón para copiarla. */
@Component({
  selector: 'lt-clave-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2">
      <mat-icon class="text-emerald-500">check_circle</mat-icon> {{ data.titulo }}
    </h2>
    <mat-dialog-content>
      <p class="text-texto-tenue text-sm mb-4">
        Esta contraseña se muestra una sola vez. Cópiala y entrégala; al primer ingreso se pedirá cambiarla.
      </p>
      @if (data.email) {
        <div class="text-sm mb-2"><span class="text-texto-tenue">Correo:</span> <b>{{ data.email }}</b></div>
      }
      <div class="flex items-center gap-2 rounded-xl border border-borde bg-superficie-2 p-3">
        <code class="flex-1 text-base font-mono tracking-wide">{{ data.clave }}</code>
        <button mat-icon-button (click)="copiar()" [attr.aria-label]="'Copiar'">
          <mat-icon>{{ copiado() ? 'done' : 'content_copy' }}</mat-icon>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Listo</button>
    </mat-dialog-actions>
  `,
})
export class ClaveDialog {
  readonly data = inject<ClaveData>(MAT_DIALOG_DATA);
  readonly copiado = signal(false);

  copiar(): void {
    navigator.clipboard?.writeText(this.data.clave).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }
}
