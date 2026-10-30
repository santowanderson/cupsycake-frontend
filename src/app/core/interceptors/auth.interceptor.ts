import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Garante que todas as requisições enviem e recebam cookies de sessão HTTP-Only
  const clonedRequest = req.clone({
    withCredentials: true,
  });
  return next(clonedRequest);
};
