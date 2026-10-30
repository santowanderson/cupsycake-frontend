import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'cart',
    loadChildren: () =>
      import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/products/products.routes').then(
        (m) => m.PRODUCTS_ROUTES,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
