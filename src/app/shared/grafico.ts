import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer,
]);

/**
 * Envoltura liviana de ECharts. Recibe la `option` y la pinta; se redimensiona
 * solo y toma los colores de la marca desde las variables CSS, asi respeta el
 * modo claro/oscuro sin configuracion extra.
 */
@Component({
  selector: 'lt-grafico',
  standalone: true,
  template: `<div #lienzo [style.height]="alto()" class="w-full"></div>`,
})
export class Grafico implements AfterViewInit, OnDestroy {
  option = input.required<echarts.EChartsCoreOption>();
  alto = input('320px');

  private lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzo');
  private chart?: echarts.ECharts;
  private ro?: ResizeObserver;

  constructor() {
    // Repinta cuando cambia la option.
    effect(() => {
      const opt = this.option();
      if (this.chart) this.chart.setOption(this.conMarca(opt), true);
    });
  }

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.lienzo().nativeElement, undefined, { renderer: 'canvas' });
    this.chart.setOption(this.conMarca(this.option()), true);
    this.ro = new ResizeObserver(() => this.chart?.resize());
    this.ro.observe(this.lienzo().nativeElement);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.chart?.dispose();
  }

  private token(nombre: string, respaldo: string): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
    return v || respaldo;
  }

  private conMarca(opt: echarts.EChartsCoreOption): echarts.EChartsCoreOption {
    const texto = this.token('--lt-texto', '#1b1e24');
    const tenue = this.token('--lt-texto-tenue', '#5b636f');
    const rojo = this.token('--lt-rojo', '#e01e26');
    const acero = this.token('--lt-acero-500', '#566070');
    const plata = this.token('--lt-acero-400', '#8a94a2');

    return {
      color: [rojo, acero, plata, '#2d7d46', '#c9962a', '#2f6fb0'],
      textStyle: { color: texto, fontFamily: 'Inter, sans-serif' },
      tooltip: { ...(opt['tooltip'] as object), backgroundColor: this.token('--lt-superficie', '#fff'), borderWidth: 0, textStyle: { color: texto } },
      ...opt,
      legend: opt['legend'] ? { textStyle: { color: tenue }, ...(opt['legend'] as object) } : undefined,
    };
  }
}
