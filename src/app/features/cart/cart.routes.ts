import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CART_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cart-detail/cart-detail.component').then(
        (m) => m.CartDetailComponent,
      ),
  },
];
