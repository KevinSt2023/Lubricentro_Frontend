import { Component, computed, input } from '@angular/core';

/** Chip de color para el estado del servicio de una empresa. */
@Component({
  selector: 'lt-estado-chip',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          [class]="clases()">
      <span class="w-1.5 h-1.5 rounded-full" [class]="punto()"></span>
      {{ texto() }}
    </span>
  `,
})
export class EstadoChip {
  estado = input.required<string>();
  dias = input<number | null>(null);

  readonly texto = computed(() => {
    switch (this.estado()) {
      case 'AL_DIA': return 'Al día';
      case 'POR_VENCER': return `Por vencer${this.dias() != null ? ` · ${this.dias()}d` : ''}`;
      case 'VENCIDO': return 'Vencido';
      case 'INACTIVA': return 'Inactiva';
      default: return this.estado();
    }
  });

  readonly clases = computed(() => {
    switch (this.estado()) {
      case 'AL_DIA': return 'bg-emerald-500/10 text-emerald-600';
      case 'POR_VENCER': return 'bg-amber-500/10 text-amber-600';
      case 'VENCIDO': return 'bg-marca-soft text-marca';
      case 'INACTIVA': return 'bg-acero-400/15 text-texto-tenue';
      default: return 'bg-acero-400/15 text-texto-tenue';
    }
  });

  readonly punto = computed(() => {
    switch (this.estado()) {
      case 'AL_DIA': return 'bg-emerald-500';
      case 'POR_VENCER': return 'bg-amber-500';
      case 'VENCIDO': return 'bg-marca';
      default: return 'bg-acero-400';
    }
  });
}
