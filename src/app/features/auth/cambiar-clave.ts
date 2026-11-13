import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SesionService } from '../../core/sesion.service';
import { ErrorApi } from '../../core/modelos';
import { Marca } from '../../shared/marca';

@Component({
  selector: 'lt-cambiar-clave',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, Marca],
  template: `
    <div class="min-h-screen grid place-items-center bg-fondo p-6">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex justify-center"><lt-marca tamano="1.6rem" /></div>
        <div class="rounded-2xl border border-borde bg-superficie p-6 shadow-sm">
          <h2 class="text-xl font-bold text-texto">Cambia tu contraseña</h2>
          <p class="text-texto-tenue text-sm mt-1 mb-5">
            Es tu primer ingreso: elige una contraseña nueva para continuar.
          </p>

          <form [formGroup]="form" (ngSubmit)="enviar()" class="flex flex-col gap-4">
            <div>
              <label class="lt-label">Contraseña actual (la temporal)</label>
              <input class="lt-input" type="password" formControlName="claveActual" autocomplete="current-password" />
            </div>
            <div>
              <label class="lt-label">Contraseña nueva</label>
              <input class="lt-input" type="password" formControlName="claveNueva" autocomplete="new-password" />
              <p class="text-xs text-texto-tenue mt-1">Mínimo 8 caracteres.</p>
            </div>
            <div>
              <label class="lt-label">Repite la nueva</label>
              <input class="lt-input" type="password" formControlName="repetir" autocomplete="new-password" />
            </div>

            @if (error()) {
              <div class="rounded-lg bg-marca-soft text-marca px-4 py-3 text-sm">{{ error() }}</div>
            }

            <button mat-flat-button color="primary" type="submit" class="!h-12 !mt-1" [disabled]="cargando()">
              Guardar y entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CambiarClave {
  private fb = inject(FormBuilder);
  private sesion = inject(SesionService);
  private router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  form = this.fb.nonNullable.group(
    {
      claveActual: ['', [Validators.required]],
      claveNueva: ['', [Validators.required, Validators.minLength(8)]],
      repetir: ['', [Validators.required]],
    },
    { validators: [coinciden] },
  );

  enviar(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      this.error.set(this.form.hasError('noCoincide') ? 'Las contraseñas no coinciden.' : null);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    const { claveActual, claveNueva } = this.form.getRawValue();
    this.sesion.cambiarClave(claveActual, claveNueva).subscribe({
      next: () => {
        // Cambiar la clave cierra la sesion: se vuelve a ingresar limpio.
        this.sesion.limpiar();
        this.router.navigate(['/ingresar']);
      },
      error: (e) => {
        this.cargando.set(false);
        const err = e.error as ErrorApi | undefined;
        this.error.set(err?.mensaje ?? 'No se pudo cambiar la contraseña.');
      },
    });
  }
}

function coinciden(c: AbstractControl): { noCoincide: true } | null {
  const nueva = c.get('claveNueva')?.value;
  const rep = c.get('repetir')?.value;
  return nueva && rep && nueva !== rep ? { noCoincide: true } : null;
}
