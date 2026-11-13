import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsolaService } from './consola.service';
import { Tablero as TableroModel } from './consola.models';
import { Grafico } from '../../shared/grafico';
import type { EChartsCoreOption } from 'echarts/core';

@Component({
  selector: 'lt-tablero',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule, Grafico],
  template: `
    @if (cargando()) {
      <div class="grid place-items-center py-20"><mat-spinner diameter="40" /></div>
    } @else if (datos(); as d) {
      <!-- KPIs -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Empresas</div>
          <div class="text-3xl font-bold mt-1">{{ d.empresas }}</div>
          <div class="text-xs text-texto-tenue mt-1">{{ d.activas }} activas · {{ d.inactivas }} inactivas</div>
        </div>
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Ingreso recurrente</div>
          <div class="text-3xl font-bold mt-1">S/ {{ d.ingresoRecurrenteMensual | number: '1.0-0' }}</div>
          <div class="text-xs text-texto-tenue mt-1">al mes, si todas renuevan</div>
        </div>
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Cobrado este mes</div>
          <div class="text-3xl font-bold mt-1">S/ {{ d.ingresoMesActual | number: '1.0-0' }}</div>
          <div class="text-xs mt-1" [class.text-emerald-600]="d.ingresoMesActual >= d.ingresoMesAnterior"
               [class.text-marca]="d.ingresoMesActual < d.ingresoMesAnterior">
            mes anterior S/ {{ d.ingresoMesAnterior | number: '1.0-0' }}
          </div>
        </div>
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="text-texto-tenue text-sm">Estado del servicio</div>
          <div class="mt-2 flex flex-col gap-1 text-sm">
            <span class="flex justify-between"><span>Al día</span><b>{{ d.alDia }}</b></span>
            <span class="flex justify-between text-amber-600"><span>Por vencer</span><b>{{ d.porVencer }}</b></span>
            <span class="flex justify-between text-marca"><span>Vencidas</span><b>{{ d.vencidas }}</b></span>
          </div>
        </div>
      </div>

      <!-- Graficos -->
      <div class="grid gap-4 lg:grid-cols-2 mb-6">
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <h3 class="font-semibold mb-2">Empresas por plan</h3>
          <lt-grafico [option]="porPlan()" alto="300px" />
        </div>
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <h3 class="font-semibold mb-2">Ingreso recurrente por plan</h3>
          <lt-grafico [option]="ingresoPorPlan()" alto="300px" />
        </div>
      </div>

      <!-- Listas -->
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <h3 class="font-semibold mb-3">Por vencer pronto</h3>
          @if (d.porVencerPronto.length) {
            <ul class="divide-y divide-borde">
              @for (e of d.porVencerPronto; track e.id) {
                <li class="py-2.5 flex items-center justify-between">
                  <a [routerLink]="['/sa/empresas', e.id]" class="hover:text-marca">
                    <div class="font-medium">{{ e.nombreComercial }}</div>
                    <div class="text-xs text-texto-tenue">{{ e.plan }}</div>
                  </a>
                  <span class="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
                    {{ e.diasRestantes }} día(s)
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="text-texto-tenue text-sm py-4">Ninguna por vencer en los próximos días.</p>
          }
        </div>

        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <h3 class="font-semibold mb-3">Últimos pagos</h3>
          @if (d.ultimosPagos.length) {
            <ul class="divide-y divide-borde">
              @for (p of d.ultimosPagos; track p.id) {
                <li class="py-2.5 flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ p.empresa }}</div>
                    <div class="text-xs text-texto-tenue">{{ p.registradoEn | date: 'dd/MM/yyyy' }} · {{ p.plan }}</div>
                  </div>
                  <b class="text-sm">S/ {{ p.monto | number: '1.2-2' }}</b>
                </li>
              }
            </ul>
          } @else {
            <p class="text-texto-tenue text-sm py-4">Todavía no hay pagos registrados.</p>
          }
        </div>
      </div>
    }
  `,
})
export class Tablero {
  private api = inject(ConsolaService);
  readonly cargando = signal(true);
  readonly datos = signal<TableroModel | null>(null);

  constructor() {
    this.api.tablero().subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  readonly porPlan = computed<EChartsCoreOption>(() => {
    const d = this.datos();
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
          label: { show: false },
          data: (d?.porPlan ?? []).map((p) => ({ name: p.plan, value: p.empresas })),
        },
      ],
    };
  });

  readonly ingresoPorPlan = computed<EChartsCoreOption>(() => {
    const d = this.datos();
    const filas = d?.porPlan ?? [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: filas.map((p) => p.plan), axisLine: { lineStyle: { color: '#8a94a2' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(138,148,162,.2)' } } },
      series: [
        {
          type: 'bar',
          barWidth: '45%',
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          data: filas.map((p) => Math.round(p.empresas * p.precioMensual)),
        },
      ],
    };
  });
}
