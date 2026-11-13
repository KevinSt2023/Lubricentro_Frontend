import { Routes } from '@angular/router';
import { sesionGuard, permisoGuard, invitadoGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'ingresar',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/ingresar').then((m) => m.Ingresar),
  },
  {
    path: 'cambiar-clave',
    canActivate: [sesionGuard],
    loadComponent: () => import('./features/auth/cambiar-clave').then((m) => m.CambiarClave),
  },
  {
    path: '',
    canActivate: [sesionGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: 'inicio', loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio) },

      // Modulos: el backend ya existe; la pantalla llega por entregas. Cada
      // ruta queda protegida por su permiso desde ya.
      {
        path: 'ordenes',
        canActivate: [permisoGuard],
        data: { permisos: ['ORDENES.VER', 'ORDENES.VER_ASIGNADAS'] },
        loadComponent: () => import('./features/ordenes/ordenes').then((m) => m.Ordenes),
      },
      {
        path: 'ordenes/:id',
        canActivate: [permisoGuard],
        data: { permisos: ['ORDENES.VER', 'ORDENES.VER_ASIGNADAS'] },
        loadComponent: () => import('./features/ordenes/orden-detalle').then((m) => m.OrdenDetallePagina),
      },
      {
        path: 'agenda',
        canActivate: [permisoGuard],
        data: { permiso: 'AGENDA.VER' },
        loadComponent: () => import('./features/agenda/agenda').then((m) => m.Agenda),
      },
      {
        path: 'clientes',
        canActivate: [permisoGuard],
        data: { permiso: 'CLIENTES.VER' },
        loadComponent: () => import('./features/maestros/clientes').then((m) => m.Clientes),
      },
      {
        path: 'vehiculos',
        canActivate: [permisoGuard],
        data: { permiso: 'VEHICULOS.VER' },
        loadComponent: () => import('./features/maestros/vehiculos').then((m) => m.Vehiculos),
      },
      {
        path: 'almacen',
        canActivate: [permisoGuard],
        data: { permiso: 'ALMACEN.VER' },
        loadComponent: () => import('./features/maestros/almacen').then((m) => m.Almacen),
      },
      {
        path: 'servicios',
        canActivate: [permisoGuard],
        data: { permiso: 'SERVICIOS.VER' },
        loadComponent: () => import('./features/maestros/servicios').then((m) => m.Servicios),
      },
      {
        path: 'personal',
        canActivate: [permisoGuard],
        data: { permiso: 'PERSONAL.VER' },
        loadComponent: () => import('./features/maestros/personal').then((m) => m.Personal),
      },
      {
        path: 'sa',
        canActivate: [permisoGuard],
        data: { soloSuperAdmin: true },
        loadComponent: () => import('./features/sa/consola').then((m) => m.Consola),
        children: [
          { path: 'tablero', loadComponent: () => import('./features/sa/tablero').then((m) => m.Tablero) },
          { path: 'empresas', loadComponent: () => import('./features/sa/empresas').then((m) => m.Empresas) },
          { path: 'empresas/:id', loadComponent: () => import('./features/sa/empresa-detalle').then((m) => m.EmpresaDetallePagina) },
          { path: 'usuarios', loadComponent: () => import('./features/sa/usuarios').then((m) => m.SaUsuarios) },
          { path: 'planes', loadComponent: () => import('./features/sa/planes').then((m) => m.Planes) },
          { path: '', pathMatch: 'full', redirectTo: 'tablero' },
        ],
      },

      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  { path: '**', redirectTo: '' },
];
