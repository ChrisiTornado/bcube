import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';

// All environment.*ApiUrl values share this origin+/api prefix (absolute in dev, relative
// same-origin in prod) - derived once so the token is only ever sent to our own backend.
const API_BASE_URL = environment.authUrl.replace(/\/auth$/, '');

/** Attaches the bearer token to our own API requests only, and force-logs-out on a 401 (expired/invalid session). */
@Injectable({ providedIn: 'root' })
export class InterceptorService implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');
    let modifiedReq = req;

    if (token && req.url.startsWith(API_BASE_URL)) {
      modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(modifiedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          sessionStorage.setItem('sessionExpiredMessage', 'Bitte melde dich erneut an.');
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}
