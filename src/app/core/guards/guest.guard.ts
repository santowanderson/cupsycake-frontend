import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se o usuário já estiver autenticado, redireciona para a página inicial
  if (authService.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  // Caso contrário, permite o acesso à rota de login/cadastro
  return true;
};
