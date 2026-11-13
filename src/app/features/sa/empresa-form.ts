import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConsolaService } from './consola.service';
import { EmpresaCreada, Plan } from './consola.models';
import { ErrorApi } from '../../core/modelos';

/**
 * Alta de una empresa: empresa + sede principal + Admin, en un paso.
 * Inputs propios (Tailwind), no los campos de Material: caja limpia, label
 * arriba, alineacion pareja en dos columnas.
 */
@Component({
  selector: 'lt-empresa-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2.5 !mb-0 !pb-1">
      <span class="grid place-items-center w-9 h-9 rounded-xl bg-marca-soft text-marca shrink-0">
        <mat-icon class="!text-xl">add_business</mat-icon>
      </span>
      <span class="text-lg font-semibold">Nueva empresa</span>
    </h2>

    <mat-dialog-content class="!max-h-[72vh]">
      <form [formGroup]="form" class="pt-2 flex flex-col gap-5">
        <!-- Empresa -->
        <section>
          <div class="lt-seccion">Datos de la empresa</div>
          <div class="grid sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label class="lt-label">RUC <span class="text-marca">*</span></label>
              <input class="lt-input" [class.lt-mal]="malo('ruc')" formControlName="ruc"
                     maxlength="11" inputmode="numeric" placeholder="11 dígitos" />
              @if (malo('ruc')) { <p class="lt-error">RUC de 11 dígitos.</p> }
            </div>
            <div>
              <label class="lt-label">Plan <span class="text-marca">*</span></label>
              <select class="lt-input" [class.lt-mal]="malo('planCodigo')" formControlName="planCodigo">
                <option value="" disabled>Elige un plan…</option>
                @for (p of planes(); track p.id) {
                  <option [value]="p.codigo">{{ p.nombre }} — S/ {{ p.precioMensual }}</option>
                }
              </select>
              @if (malo('planCodigo')) { <p class="lt-error">Elige un plan.</p> }
            </div>
            <div class="sm:col-span-2">
              <label class="lt-label">Razón social <span class="text-marca">*</span></label>
              <input class="lt-input" [class.lt-mal]="malo('razonSocial')" formControlName="razonSocial" />
              @if (malo('razonSocial')) { <p class="lt-error">Obligatorio.</p> }
            </div>
            <div class="sm:col-span-2">
              <label class="lt-label">Nombre comercial <span class="text-marca">*</span></label>
              <input class="lt-input" [class.lt-mal]="malo('nombreComercial')" formControlName="nombreComercial" />
              @if (malo('nombreComercial')) { <p class="lt-error">Obligatorio.</p> }
            </div>
            <div>
              <label class="lt-label">Teléfono</label>
              <input class="lt-input" formControlName="telefono" inputmode="tel" />
            </div>
            <div>
              <label class="lt-label">Días de cortesía</label>
              <input class="lt-input" type="number" formControlName="diasDeCortesia" min="0" max="90" />
            </div>
          </div>
        </section>

        <!-- Admin -->
        <section formGroupName="admin">
          <div class="lt-seccion">Admin de la empresa</div>
          <div class="grid sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label class="lt-label">Nombres <span class="text-marca">*</span></label>
              <input class="lt-input" [class.lt-mal]="malo('admin.nombres')" formControlName="nombres" />
              @if (malo('admin.nombres')) { <p class="lt-error">Obligatorio.</p> }
            </div>
            <div>
              <label class="lt-label">Apellidos <span class="text-marca">*</span></label>
              <input class="lt-input" [class.lt-mal]="malo('admin.apellidos')" formControlName="apellidos" />
              @if (malo('admin.apellidos')) { <p class="lt-error">Obligatorio.</p> }
            </div>
            <div class="sm:col-span-2">
              <label class="lt-label">Correo del Admin <span class="text-marca">*</span></label>
              <input class="lt-input" [class.lt-mal]="malo('admin.email')" type="email" formControlName="email"
                     placeholder="correo@dominio.pe" />
              @if (malo('admin.email')) { <p class="lt-error">Correo válido obligatorio.</p> }
            </div>
          </div>
        </section>

        <!-- Sede -->
        <section formGroupName="sedePrincipal">
          <div class="lt-seccion">Sede principal</div>
          <div>
            <label class="lt-label">Nombre de la sede <span class="text-marca">*</span></label>
            <input class="lt-input" [class.lt-mal]="malo('sedePrincipal.nombre')" formControlName="nombre" />
            @if (malo('sedePrincipal.nombre')) { <p class="lt-error">Obligatorio.</p> }
          </div>
        </section>

        @if (error()) {
          <div class="flex items-center gap-2 rounded-lg bg-marca-soft text-marca px-4 py-3 text-sm">
            <mat-icon class="!text-base">error_outline</mat-icon> {{ error() }}
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-5 !pt-2 gap-1">
      <button mat-button mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="guardando()">
        <mat-icon>add</mat-icon> Crear empresa
      </button>
    </mat-dialog-actions>
  `,
})
export class EmpresaForm {
  private fb = inject(FormBuilder);
  private api = inject(ConsolaService);
  private ref = inject(MatDialogRef<EmpresaForm, EmpresaCreada>);

  readonly planes = signal<Plan[]>([]);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
    planCodigo: ['', Validators.required],
    razonSocial: ['', Validators.required],
    nombreComercial: ['', Validators.required],
    telefono: [''],
    diasDeCortesia: [7, [Validators.min(0), Validators.max(90)]],
    admin: this.fb.nonNullable.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    }),
    sedePrincipal: this.fb.nonNullable.group({
      nombre: ['Sede Principal', Validators.required],
    }),
  });

  constructor() {
    this.api.planes().subscribe((p) => this.planes.set(p.filter((x) => x.activo)));
  }

  malo(path: string): boolean {
    const c = this.form.get(path);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  guardar(): void {
    if (this.guardando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados en rojo: faltan datos obligatorios.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.api.crearEmpresa(this.form.getRawValue()).subscribe({
      next: (r) => this.ref.close(r),
      error: (e) => {
        this.guardando.set(false);
        this.error.set((e.error as ErrorApi)?.mensaje ?? 'No se pudo crear la empresa.');
      },
    });
  }
}
