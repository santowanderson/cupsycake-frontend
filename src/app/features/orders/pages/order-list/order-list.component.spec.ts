import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { Order } from '../../../../core/models/order.model';
import { Product } from '../../../../core/models/product.model';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../products/services/product.service';
import { OrderListComponent } from './order-list.component';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;
  let orderServiceMock: { getOrders: jest.Mock };
  let productServiceMock: { products: ReturnType<typeof signal<Product[]>> };

  const mockOrders: Order[] = [
    {
      id: 1,
      total_amount: 50.0,
      shipping_fee: 5.0,
      status: 'completed',
      created_at: '2026-05-10T12:00:00Z',
      items: [],
    },
    {
      id: 2,
      total_amount: 120.5,
      shipping_fee: 10.0,
      status: 'pending',
      created_at: '2025-11-15T14:30:00Z',
      items: [],
    },
    {
      id: 3,
      total_amount: 35.0,
      shipping_fee: 0.0,
      status: 'completed',
      created_at: '2026-01-05T09:15:00Z',
      items: [],
    },
  ];

  const mockProducts: Product[] = [
    {
      id: 101,
      name: 'Cupcake de Chocolate',
      slug: 'cupcake-de-chocolate',
      price: 10.0,
      description: 'Delicioso cupcake',
      image_url: 'chocolate.jpg',
      stock_quantity: 10,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      tags: [],
    },
  ];

  beforeEach(async () => {
    orderServiceMock = {
      getOrders: jest.fn().mockReturnValue(of(mockOrders)),
    };

    productServiceMock = {
      products: signal<Product[]>(mockProducts),
    };

    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        provideRouter([]), // Necessário para suporte ao RouterLink no template
        { provide: OrderService, useValue: orderServiceMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE CICLO DE VIDA E CARREGAMENTO (ngOnInit / loadOrders)
  // ==========================================
  describe('Lifecycle & Order Loading', () => {
    it('should call loadOrders on ngOnInit and populate orders successfully', () => {
      expect(orderServiceMock.getOrders).toHaveBeenCalledTimes(1);
      expect(component.orders()).toEqual(mockOrders);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('should handle order loading errors gracefully, set errorMessage and stop loading', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      orderServiceMock.getOrders.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      component.loadOrders();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe(
        'Não foi possível carregar seus pedidos. Tente novamente mais tarde.',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao carregar pedidos:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // 2. TESTES DE FILTRAGEM E ANOS (Computed Signals)
  // ==========================================
  describe('Computed Signals (availableYears & filteredOrders)', () => {
    it('should extract available years uniquely and sort them in descending order with ALL prepended', () => {
      const years = component.availableYears();
      expect(years).toEqual(['ALL', '2026', '2025']);
    });

    it('should return all orders when selectedYear is ALL', () => {
      component.selectedYear.set('ALL');
      expect(component.filteredOrders()).toEqual(mockOrders);
    });

    it('should filter orders correctly by a specific selected year', () => {
      component.filterByYear('2025');

      const filtered = component.filteredOrders();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(2); // Pedido de 2025
    });
  });

  // ==========================================
  // 3. TESTES DE MÉTODOS AUXILIARES (formatPrice & imageUrl)
  // ==========================================
  describe('Utility Methods', () => {
    it('should format price correctly or return 0.00 for invalid values', () => {
      expect(component.formatPrice(50)).toBe('50.00');
      expect(component.formatPrice('120.5')).toBe('120.50');
      expect(component.formatPrice('invalid')).toBe('0.00');
    });

    it('should resolve product image URL correctly based on product ID', () => {
      const url = component.imageUrl(101);
      expect(url).toBe('assets/images/chocolate.jpg');
    });

    it('should handle missing products gracefully in imageUrl lookup', () => {
      const url = component.imageUrl(999); // ID inexistente
      expect(url).toBe('assets/images/undefined');
    });
  });
});
