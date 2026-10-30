import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { Product } from '../../../../core/models/product.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartItem, CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../products/services/product.service';
import { CartDetailComponent } from './cart-detail.component';

describe('CartDetailComponent', () => {
  let component: CartDetailComponent;
  let fixture: ComponentFixture<CartDetailComponent>;
  let router: Router;
  let cartServiceMock: {
    items: ReturnType<typeof signal<CartItem[]>>;
    subtotal: ReturnType<typeof signal<number>>;
    updateQuantity: jest.Mock;
    removeFromCart: jest.Mock;
    clearCart: jest.Mock;
  };
  let orderServiceMock: { createOrder: jest.Mock };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<{ id: number; name: string } | null>>;
  };
  let productServiceMock: {
    products: ReturnType<typeof signal<Product[]>>;
    getImageUrl: jest.Mock;
  };

  const mockProduct: Product = {
    id: 1,
    name: 'Cupcake de Chocolate',
    slug: 'cupcake-de-chocolate',
    price: 10.0,
    description: 'Delicioso cupcake de chocolate',
    image_url: 'chocolate.jpg',
    stock_quantity: 20,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    tags: [],
  };

  const mockCartItems: CartItem[] = [
    {
      product: mockProduct,
      quantity: 2,
    },
  ];

  beforeEach(async () => {
    cartServiceMock = {
      items: signal<CartItem[]>(mockCartItems),
      subtotal: signal<number>(20.0),
      updateQuantity: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
    };

    orderServiceMock = {
      createOrder: jest
        .fn()
        .mockReturnValue(of({ success: true, order_id: 123 })),
    };

    authServiceMock = {
      currentUser: signal<{ id: number; name: string } | null>({
        id: 1,
        name: 'Wanderson',
      }),
    };

    productServiceMock = {
      products: signal<Product[]>([mockProduct]),
      getImageUrl: jest.fn().mockReturnValue('assets/images/chocolate.jpg'), // Mock da função chamada no template HTML
    };

    await TestBed.configureTestingModule({
      imports: [CartDetailComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));

    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE FORMATAÇÃO E CÁLCULOS
  // ==========================================
  describe('Formatting & Pricing Computations', () => {
    it('should format prices correctly or return 0.00 for invalid values', () => {
      expect(component.formatPrice(15.5)).toBe('15.50');
      expect(component.formatPrice('42')).toBe('42.00');
      expect(component.formatPrice('invalid')).toBe('0.00');
      expect(component.formatPrice(undefined)).toBe('0.00');
    });

    it('should calculate individual item total correctly', () => {
      expect(component.getItemTotal(12.5, 3)).toBe('37.50');
    });

    it('should compute total amount including shipping fee when cart is not empty', () => {
      // Subtotal = 20.00, Shipping = 10.00 -> Total = 30.00
      expect(component.totalAmount()).toBe(30.0);
    });

    it('should compute total amount without shipping fee when cart is empty', () => {
      cartServiceMock.items.set([]);
      cartServiceMock.subtotal.set(0);

      expect(component.totalAmount()).toBe(0);
    });
  });

  // ==========================================
  // 2. TESTES DE MANIPULAÇÃO DE ITENS DO CARRINHO
  // ==========================================
  describe('Cart Item Management', () => {
    it('should delegate quantity update to CartService with correct delta', () => {
      component.updateQuantity(1, 1);
      expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(1, 3); // 2 atuais + 1 delta

      component.updateQuantity(1, -1);
      expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(1, 1); // 2 atuais - 1 delta
    });

    it('should ignore quantity update if item does not exist in cart', () => {
      component.updateQuantity(999, 1);
      expect(cartServiceMock.updateQuantity).not.toHaveBeenCalled();
    });

    it('should delegate item removal to CartService', () => {
      component.removeItem(1);
      expect(cartServiceMock.removeFromCart).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================
  // 3. TESTES DE CHECKOUT E AUTENTICAÇÃO
  // ==========================================
  describe('Checkout Workflow', () => {
    it('should redirect to login with returnUrl if user is unauthenticated', () => {
      authServiceMock.currentUser.set(null); // Desloga o usuário

      component.checkout();

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/cart' },
      });
      expect(orderServiceMock.createOrder).not.toHaveBeenCalled();
    });

    it('should do nothing if cart is empty during checkout', () => {
      cartServiceMock.items.set([]);

      component.checkout();

      expect(orderServiceMock.createOrder).not.toHaveBeenCalled();
    });

    it('should process order successfully, clear cart, and navigate to /orders on success', () => {
      component.deliveryNotes.set('Deixar na portaria');

      component.checkout();

      expect(component.isSubmitting()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(orderServiceMock.createOrder).toHaveBeenCalledWith({
        shipping_address_id: 1,
        shipping_fee: 10.0,
        notes: 'Deixar na portaria',
        items: [{ product_id: 1, quantity: 2 }],
      });
      expect(cartServiceMock.clearCart).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should handle order creation error gracefully and display error message', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      orderServiceMock.createOrder.mockReturnValue(
        throwError(() => ({ error: { error: 'Estoque insuficiente' } })),
      );

      component.checkout();

      expect(component.isSubmitting()).toBe(false);
      expect(component.errorMessage()).toBe('Estoque insuficiente');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao finalizar pedido:',
        expect.any(Object),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should fall back to generic error message if server error detail is missing', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      orderServiceMock.createOrder.mockReturnValue(
        throwError(() => ({ error: {} })),
      );

      component.checkout();

      expect(component.errorMessage()).toBe(
        'Erro ao processar o pedido. Tente novamente.',
      );
    });
  });
});
