import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/order-list/order-list.component').then(
        (m) => m.OrderListComponent,
      ),
  },
];
