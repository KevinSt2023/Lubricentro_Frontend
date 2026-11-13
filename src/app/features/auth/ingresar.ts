import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SesionService } from '../../core/sesion.service';
import { ErrorApi } from '../../core/modelos';
import { Marca } from '../../shared/marca';

@Component({
  selector: 'lt-ingresar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Marca,
  ],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-fondo">
      <!-- Panel de marca (se oculta en movil) -->
      <div class="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden
                  bg-grafito-900 text-plata">
        <div class="absolute inset-0 opacity-[0.07]"
             style="background-image: repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 22px);"></div>
        <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full"
             style="background: radial-gradient(circle, rgba(224,30,38,.35), transparent 70%)"></div>
        <lt-marca class="relative" tamano="1.8rem" icono="2.6rem" iconoSvg="1.6rem" />
        <div class="relative">
          <h1 class="text-4xl font-extrabold leading-tight text-white">
            Tu taller,<br />bajo control.
          </h1>
          <p class="mt-4 text-plata/70 max-w-sm">
            Sistema de gestión para lubricentros y talleres mecánicos. Órdenes,
            inventario, clientes y caja en un solo lugar.
          </p>
        </div>
        <p class="relative text-xs text-plata/40">© {{ anio }} LubriTech</p>
      </div>

      <!-- Formulario -->
      <div class="flex items-center justify-center p-6">
        <div class="w-full max-w-sm">
          <div class="lg:hidden mb-8 flex justify-center">
            <lt-marca tamano="1.6rem" icono="2.4rem" iconoSvg="1.5rem" />
          </div>

          <h2 class="text-2xl font-bold text-texto">Ingresar</h2>
          <p class="text-texto-tenue mt-1 mb-6">Entra con tu cuenta del equipo.</p>

          <form [formGroup]="form" (ngSubmit)="enviar()" class="flex flex-col gap-2">
            <mat-form-field appearance="outline">
              <mat-label>Correo</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="username"
                     placeholder="tucorreo@taller.pe" />
              <mat-icon matSuffix>mail</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="verClave() ? 'text' : 'password'" formControlName="password"
                     autocomplete="current-password" />
              <button mat-icon-button matSuffix type="button" (click)="verClave.set(!verClave())"
                      [attr.aria-label]="verClave() ? 'Ocultar' : 'Mostrar'">
                <mat-icon>{{ verClave() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (error()) {
              <div class="rounded-lg bg-marca-soft text-marca px-4 py-3 text-sm flex items-center gap-2">
                <mat-icon class="!text-base !w-4 !h-4">error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-flat-button color="primary" type="submit" class="!h-12 !mt-2"
                    [disabled]="cargando()">
              @if (cargando()) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                Ingresar
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class Ingresar {
  private fb = inject(FormBuilder);
  private sesion = inject(SesionService);
  private router = inject(Router);

  readonly anio = new Date().getFullYear();
  readonly cargando = signal(false);
  readonly verClave = signal(false);
  readonly error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  enviar(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.sesion.ingresar(email, password).subscribe({
      next: (s) => {
        this.cargando.set(false);
        this.router.navigate([s.perfil.debeCambiarClave ? '/cambiar-clave' : '/inicio']);
      },
      error: (e) => {
        this.cargando.set(false);
        const err = e.error as ErrorApi | undefined;
        this.error.set(err?.mensaje ?? 'No se pudo ingresar. Revisa tus datos.');
      },
    });
  }
}
