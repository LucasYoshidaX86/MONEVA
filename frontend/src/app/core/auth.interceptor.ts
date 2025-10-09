import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authHttpInterceptor: HttpInterceptorFn = (req, next) => {
  // Se você tiver token JWT no futuro, injete aqui no header:
  // const token = localStorage.getItem('access_token');
  // const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  // return next(authReq) ...

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      console.error('HTTP error', err);
      return throwError(() => err);
    })
  );
};
