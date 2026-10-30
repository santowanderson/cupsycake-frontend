import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    // Mantém a verificação rápida via flag local para evitar requisições desnecessárias se o storage estiver vazio
    if (localStorage.getItem('has_active_session') === 'true') {
      this.loadProfile().subscribe();
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/api/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response && response.success === false) {
            throw {
              status: 401,
              error: { error: response.error || 'Credenciais inválidas.' },
            };
          }

          // MELHORIA DE PERFORMANCE (OCP): Aproveitamos os dados do usuário já retornados pelo login
          // Evita realizar um novo HTTP GET /profile bloqueante antes de liberar a navegação.
          localStorage.setItem('has_active_session', 'true');
          if (response && response.user) {
            this.currentUser.set(response.user);
          }
        }),
        catchError((error) => {
          // Garante tratamento padronizado do erro lançado acima ou retornado pelo HTTP
          if (error.status === 401 || error.error?.success === false) {
            return throwError(() => ({
              status: 401,
              error: { error: error.error?.error || 'Credenciais inválidas.' },
            }));
          }
          return throwError(() => error);
        }),
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register`, userData);
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/api/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          localStorage.removeItem('has_active_session');
          this.currentUser.set(null);

          const currentUrl = this.router.url;
          if (currentUrl.includes('/cart') || currentUrl.includes('/orders')) {
            this.router.navigate(['/']);
          } else {
            this.router.navigate(['/auth/login']);
          }
        }),
      );
  }

  loadProfile(): Observable<UserProfile | null> {
    return this.http
      .get<UserProfile>(`${this.apiUrl}/api/auth/profile`, {
        withCredentials: true,
      })
      .pipe(
        tap((profile) => {
          localStorage.setItem('has_active_session', 'true');
          this.currentUser.set(profile);
        }),
        catchError((error) => {
          if (error.status === 401) {
            localStorage.removeItem('has_active_session');
            this.currentUser.set(null);
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  validateAuthAndRedirect(returnUrl: string = '/cart'): boolean {
    if (this.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl } });
    return false;
  }
}
