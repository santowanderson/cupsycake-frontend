import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/orders';

  /**
   * Busca todos os pedidos do usuário autenticado
   */
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl, { withCredentials: true });
  }

  /**
   * Cria um novo pedido no sistema
   */
  createOrder(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload, { withCredentials: true });
  }
}
