import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConsolaService } from './consola.service';
import { EmpresaCreada, Plan } from './consola.models';
import { ErrorApi } from '../../core/modelos';

/** Alta de una empresa: empresa + sede principal + Admin, en un paso. */
@Component({
  selector: 'lt-empresa-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2">
      <mat-icon class="text-marca">add_business</mat-icon> Nueva empresa
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-1 pt-2">
        <div class="text-xs font-semibold text-texto-tenue uppercase tracking-wide mb-1">Datos de la empresa</div>
        <div class="grid sm:grid-cols-2 gap-x-4">
          <mat-form-field appearance="outline">
            <mat-label>RUC</mat-label>
            <input matInput formControlName="ruc" maxlength="11" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Plan</mat-label>
            <mat-select formControlName="planCodigo">
              @for (p of planes(); track p.id) {
                <mat-option [value]="p.codigo">{{ p.nombre }} — S/ {{ p.precioMensual }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Razón social</mat-label>
          <input matInput formControlName="razonSocial" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nombre comercial</mat-label>
          <input matInput formControlName="nombreComercial" />
        </mat-form-field>
        <div class="grid sm:grid-cols-2 gap-x-4">
          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="telefono" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Días de cortesía</mat-label>
            <input matInput type="number" formControlName="diasDeCortesia" min="0" max="90" />
          </mat-form-field>
        </div>

        <div class="text-xs font-semibold text-texto-tenue uppercase tracking-wide mb-1 mt-2">Admin de la empresa</div>
        <div class="grid sm:grid-cols-2 gap-x-4" formGroupName="admin">
          <mat-form-field appearance="outline">
            <mat-label>Nombres</mat-label>
            <input matInput formControlName="nombres" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Apellidos</mat-label>
            <input matInput formControlName="apellidos" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>Correo del Admin</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
        </div>

        <div class="text-xs font-semibold text-texto-tenue uppercase tracking-wide mb-1 mt-2">Sede principal</div>
        <div formGroupName="sedePrincipal">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre de la sede</mat-label>
            <input matInput formControlName="nombre" />
          </mat-form-field>
        </div>

        @if (error()) {
          <div class="rounded-lg bg-marca-soft text-marca px-4 py-3 text-sm">{{ error() }}</div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="guardando()">
        Crear empresa
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

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
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
