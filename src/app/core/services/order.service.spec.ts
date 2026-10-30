import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Order } from '../models/order.model';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const mockOrders: Order[] = [
    {
      id: 1,
      total_amount: 150.0,
      shipping_fee: 10.0,
      status: 'completed',
      created_at: '2026-05-10T12:00:00Z',
      items: [],
    },
    {
      id: 2,
      total_amount: 80.0,
      shipping_fee: 5.0,
      status: 'pending',
      created_at: '2026-06-01T14:30:00Z',
      items: [],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Assegura que não há requisições HTTP pendentes sem validação
    httpMock.verify();
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE RECUPERAÇÃO DE PEDIDOS (getOrders)
  // ==========================================
  describe('getOrders', () => {
    it('should fetch user orders via GET with credentials enabled', () => {
      let result: Order[] = [];

      service.getOrders().subscribe((orders) => {
        result = orders;
      });

      const req = httpMock.expectOne('http://localhost:3000/api/orders');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true); // Valida o envio de cookies de sessão
      req.flush(mockOrders);

      expect(result).toEqual(mockOrders);
    });
  });

  // ==========================================
  // 2. TESTES DE CRIAÇÃO DE PEDIDOS (createOrder)
  // ==========================================
  describe('createOrder', () => {
    it('should send a POST request with the correct payload and credentials enabled', () => {
      const orderPayload = {
        shipping_address_id: 1,
        shipping_fee: 10.0,
        notes: 'Deixar na portaria',
        items: [{ product_id: 1, quantity: 2 }],
      };

      const mockResponse = { success: true, order_id: 101 };
      let response: any;

      service.createOrder(orderPayload).subscribe((res) => {
        response = res;
      });

      const req = httpMock.expectOne('http://localhost:3000/api/orders');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(orderPayload);
      expect(req.request.withCredentials).toBe(true); // Valida o envio de credenciais no POST
      req.flush(mockResponse);

      expect(response).toEqual(mockResponse);
    });
  });
});
