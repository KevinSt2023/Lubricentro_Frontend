import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { EChartsCoreOption } from 'echarts/core';
import { TableroService, TableroTaller } from './tablero.service';
import { Grafico } from '../../shared/grafico';

/** Tablero operativo del taller: la foto del día para el Admin/Gerente. */
@Component({
  selector: 'lt-tablero-taller',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatIconModule, MatProgressSpinnerModule, Grafico],
  template: `
    @if (cargando()) {
      <div class="grid place-items-center py-16"><mat-spinner diameter="36" /></div>
    } @else if (d(); as t) {
      <!-- KPIs -->
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <a routerLink="/ordenes" class="rounded-2xl border border-borde bg-superficie p-5 hover:border-marca/40 transition-colors">
          <div class="flex items-center justify-between">
            <span class="text-texto-tenue text-sm">Órdenes abiertas</span>
            <mat-icon class="text-marca !text-xl">build</mat-icon>
          </div>
          <div class="text-3xl font-bold mt-1 tabular">{{ t.ordenesAbiertas }}</div>
          <div class="text-xs text-texto-tenue mt-1">{{ t.ordenesHoy }} abiertas hoy</div>
        </a>
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="flex items-center justify-between">
            <span class="text-texto-tenue text-sm">Cotizaciones pendientes</span>
            <mat-icon class="text-amber-500 !text-xl">hourglass_top</mat-icon>
          </div>
          <div class="text-3xl font-bold mt-1 tabular">{{ t.cotizacionesPendientes }}</div>
          <div class="text-xs text-texto-tenue mt-1">esperando al cliente</div>
        </div>
        <a routerLink="/almacen" class="rounded-2xl border border-borde bg-superficie p-5 hover:border-marca/40 transition-colors"
           [class.border-marca]="t.productosBajoMinimo > 0">
          <div class="flex items-center justify-between">
            <span class="text-texto-tenue text-sm">Stock bajo mínimo</span>
            <mat-icon class="!text-xl" [class.text-marca]="t.productosBajoMinimo > 0" [class.text-texto-tenue]="t.productosBajoMinimo === 0">warning</mat-icon>
          </div>
          <div class="text-3xl font-bold mt-1 tabular" [class.text-marca]="t.productosBajoMinimo > 0">{{ t.productosBajoMinimo }}</div>
          <div class="text-xs text-texto-tenue mt-1">producto(s) por reponer</div>
        </a>
        <div class="rounded-2xl border border-borde bg-superficie p-5">
          <div class="flex items-center justify-between">
            <span class="text-texto-tenue text-sm">Trabajos del mes</span>
            <mat-icon class="text-emerald-500 !text-xl">payments</mat-icon>
          </div>
          <div class="text-3xl font-bold mt-1 tabular">S/ {{ t.valorTrabajosMes | number: '1.0-0' }}</div>
          <div class="text-xs text-texto-tenue mt-1">registrado, sin contar anuladas</div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid gap-4 lg:grid-cols-2 mb-6 items-stretch">
        <div class="rounded-2xl border border-borde bg-superficie p-5 flex flex-col">
          <h3 class="text-sm font-semibold mb-3">Órdenes por estado</h3>
          <lt-grafico [option]="porEstado()" alto="300px" />
        </div>
        <div class="rounded-2xl border border-borde bg-superficie p-5 flex flex-col">
          <h3 class="text-sm font-semibold mb-3">Carga por técnico</h3>
          @if (t.cargaPorTecnico.length) {
            <lt-grafico [option]="cargaTecnico()" alto="300px" />
          } @else {
            <div class="grid place-items-center text-texto-tenue text-sm" style="height:300px">Sin órdenes asignadas a técnicos.</div>
          }
        </div>
      </div>

      <!-- Últimas órdenes -->
      <div class="rounded-2xl border border-borde bg-superficie p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold">Últimas órdenes</h3>
          <a routerLink="/ordenes" class="text-sm text-marca hover:underline">Ver todas</a>
        </div>
        @if (t.ultimasOrdenes.length) {
          <ul class="divide-y divide-borde">
            @for (o of t.ultimasOrdenes; track o.id) {
              <li>
                <a [routerLink]="['/ordenes', o.id]" class="py-2.5 flex items-center justify-between gap-3 hover:text-marca">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="font-mono text-xs px-1.5 py-0.5 rounded bg-superficie-2 border border-borde shrink-0">#{{ o.numero }}</span>
                    <span class="font-mono font-semibold shrink-0">{{ o.placa }}</span>
                    <span class="text-texto-tenue truncate">{{ o.cliente }}</span>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                          [class]="o.estado === 'Anulada' ? 'bg-marca-soft text-marca' : o.estadoFinal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-marca/10 text-marca'">{{ o.estado }}</span>
                    <span class="text-sm font-semibold w-20 text-right">S/ {{ o.total | number: '1.2-2' }}</span>
                  </div>
                </a>
              </li>
            }
          </ul>
        } @else {
          <p class="text-texto-tenue text-sm py-4 text-center">Todavía no hay órdenes registradas.</p>
        }
      </div>
    }
  `,
})
export class TableroTallerPanel {
  private api = inject(TableroService);
  readonly cargando = signal(true);
  readonly d = signal<TableroTaller | null>(null);

  constructor() {
    this.api.tablero().subscribe({
      next: (t) => { this.d.set(t); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  readonly porEstado = computed<EChartsCoreOption>(() => {
    const filas = this.d()?.porEstado ?? [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: filas.map((e) => e.estado), axisLabel: { interval: 0, rotate: 30, fontSize: 10 }, axisLine: { lineStyle: { color: '#8a94a2' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(138,148,162,.2)' } } },
      series: [{ type: 'bar', barWidth: '50%', itemStyle: { borderRadius: [6, 6, 0, 0] }, data: filas.map((e) => e.cantidad) }],
    };
  });

  readonly cargaTecnico = computed<EChartsCoreOption>(() => {
    const filas = (this.d()?.cargaPorTecnico ?? []).slice(0, 8).reverse();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(138,148,162,.2)' } } },
      yAxis: { type: 'category', data: filas.map((c) => c.tecnico), axisLine: { lineStyle: { color: '#8a94a2' } } },
      series: [{ type: 'bar', barWidth: '55%', itemStyle: { borderRadius: [0, 6, 6, 0] }, data: filas.map((c) => c.cantidad) }],
    };
  });
}
