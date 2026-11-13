import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { SesionService } from './sesion.service';
import { environment } from '../../environments/environment';

// Estado compartido del refresh: si varias peticiones chocan con un 401 a la
// vez, solo una renueva y las demas esperan ese resultado.
let refrescando = false;
const tokenNuevo$ = new BehaviorSubject<string | null>(null);

/**
 * Pone el Bearer y la cabecera X-App en cada llamada al API, y maneja el 401:
 * intenta renovar con el refresh rotativo una sola vez; si tampoco, saca al
 * usuario al login. Nunca entra en bucle: la propia llamada de refrescar se
 * excluye del reintento.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  const esApi = req.url.startsWith(environment.apiUrl);
  const esLogin = req.url.includes('/auth/login');
  const esRefrescar = req.url.includes('/auth/refrescar');

  const conCabeceras = (token: string | null) => {
    let r = req;
    if (esApi) {
      r = r.clone({
        setHeaders: {
          'X-App': 'ERP_WEB',
          ...(token && !esLogin && !esRefrescar ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    }
    return r;
  };

  return next(conCabeceras(sesion.token)).pipe(
    catchError((err: HttpErrorResponse) => {
      // Un 401 en una llamada normal del API: intentar renovar la sesion.
      if (err.status === 401 && esApi && !esLogin && !esRefrescar && sesion.refreshToken) {
        if (refrescando) {
          // Ya hay un refresh en curso: esperar su token y reintentar.
          return tokenNuevo$.pipe(
            filter((t) => t !== null),
            take(1),
            switchMap((t) => next(conCabeceras(t))),
          );
        }

        refrescando = true;
        tokenNuevo$.next(null);

        return sesion.refrescar().pipe(
          switchMap((s) => {
            refrescando = false;
            tokenNuevo$.next(s.token);
            return next(conCabeceras(s.token));
          }),
          catchError((e) => {
            refrescando = false;
            sesion.limpiar();
            router.navigate(['/ingresar']);
            return throwError(() => e);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};
