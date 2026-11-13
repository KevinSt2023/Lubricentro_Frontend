import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

/** Exige sesion. Sin ella, al login. Si debe cambiar la clave, al cambio. */
export const sesionGuard: CanActivateFn = (route) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  const perfil = sesion.perfil();
  if (!perfil) return router.createUrlTree(['/ingresar']);

  // El primer ingreso obliga a cambiar la clave antes de entrar a nada.
  const yendoACambiar = route.routeConfig?.path === 'cambiar-clave';
  if (perfil.debeCambiarClave && !yendoACambiar) {
    return router.createUrlTree(['/cambiar-clave']);
  }
  return true;
};

/** Exige un permiso (data.permiso) o cualquiera de varios (data.permisos). */
export const permisoGuard: CanActivateFn = (route) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  const soloSa = route.data?.['soloSuperAdmin'] as boolean | undefined;
  const uno = route.data?.['permiso'] as string | undefined;
  const varios = route.data?.['permisos'] as string[] | undefined;

  // El SuperAdmin no entra a los modulos de empresa: su sitio es la consola.
  // Si cae en una ruta de taller (por URL directa), se le manda a la consola.
  if (!soloSa && sesion.esSuperAdmin()) {
    return router.createUrlTree(['/sa']);
  }

  const ok = soloSa
    ? sesion.esSuperAdmin()
    : uno
      ? sesion.puede(uno)
      : varios
        ? sesion.puedeAlguno(...varios)
        : true;
  return ok ? true : router.createUrlTree(['/inicio']);
};

/** Para el login: si ya hay sesion, no volver a mostrarlo. */
export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return sesion.autenticado() ? router.createUrlTree(['/inicio']) : true;
};
