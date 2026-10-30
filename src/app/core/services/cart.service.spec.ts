import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Product } from '../models/product.model';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  const mockProductA: Product = {
    id: 1,
    name: 'Cupcake de Chocolate',
    slug: 'cupcake-de-chocolate',
    price: 10.5,
    description: 'Delicioso cupcake',
    image_url: 'chocolate.jpg',
    stock_quantity: 5,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    tags: [],
  };

  const mockProductB: Product = {
    id: 2,
    name: 'Cupcake de Morango',
    slug: 'cupcake-de-morango',
    price: 12.0,
    description: 'Cupcake recheado com morango',
    image_url: 'morango.jpg',
    stock_quantity: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    tags: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartService],
    });
    service = TestBed.inject(CartService);
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
    expect(service.items()).toEqual([]);
    expect(service.isCartVisible()).toBe(false);
    expect(service.totalItems()).toBe(0);
    expect(service.subtotal()).toBe(0);
  });

  // ==========================================
  // 1. TESTES DE ADIÇÃO AO CARRINHO (addToCart)
  // ==========================================
  describe('addToCart', () => {
    it('should add a new product to the cart and normalize price to number', () => {
      const productWithStrPrice = { ...mockProductA, price: '10.50' as any };

      service.addToCart(productWithStrPrice, 2);

      const items = service.items();
      expect(items.length).toBe(1);
      expect(items[0].product.price).toBe(10.5);
      expect(typeof items[0].product.price).toBe('number');
      expect(items[0].quantity).toBe(2);
      expect(service.totalItems()).toBe(2);
      expect(service.subtotal()).toBe(21.0);
      expect(service.isCartVisible()).toBe(true);
    });

    it('should increment quantity if the product already exists in the cart', () => {
      service.addToCart(mockProductA, 1);
      service.addToCart(mockProductA, 2);

      const items = service.items();
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(3);
      expect(service.totalItems()).toBe(3);
      expect(service.subtotal()).toBe(31.5);
    });

    it('should respect stock_quantity limits when adding items', () => {
      // mockProductB tem estoque máximo de 2
      service.addToCart(mockProductB, 5); // Tenta adicionar 5

      const items = service.items();
      expect(items[0].quantity).toBe(2); // Limitado ao estoque (2)
      expect(service.totalItems()).toBe(2);
    });

    it('should limit accumulated quantity to stock_quantity when adding iteratively', () => {
      service.addToCart(mockProductB, 1);
      service.addToCart(mockProductB, 5); // Tenta adicionar mais 5 (total seria 6, mas limite é 2)

      const items = service.items();
      expect(items[0].quantity).toBe(2);
    });
  });

  // ==========================================
  // 2. TESTES DE REMOÇÃO E LIMPEZA (removeFromCart / clearCart)
  // ==========================================
  describe('Removal & Clearing', () => {
    beforeEach(() => {
      service.addToCart(mockProductA, 2);
      service.addToCart(mockProductB, 1);
    });

    it('should remove a specific product from cart by id', () => {
      expect(service.items().length).toBe(2);

      service.removeFromCart(1); // Remove mockProductA

      const items = service.items();
      expect(items.length).toBe(1);
      expect(items[0].product.id).toBe(2);
      expect(service.totalItems()).toBe(1);
    });

    it('should clear all items from cart', () => {
      expect(service.items().length).toBe(2);

      service.clearCart();

      expect(service.items()).toEqual([]);
      expect(service.totalItems()).toBe(0);
      expect(service.subtotal()).toBe(0);
      expect(service.isCartVisible()).toBe(false);
    });
  });

  // ==========================================
  // 3. TESTES DE ATUALIZAÇÃO DE QUANTIDADE (updateQuantity)
  // ==========================================
  describe('updateQuantity', () => {
    beforeEach(() => {
      service.addToCart(mockProductA, 2); // ID 1, Stock 5
    });

    it('should update item quantity correctly within stock limit', () => {
      service.updateQuantity(1, 4);

      expect(service.items()[0].quantity).toBe(4);
      expect(service.totalItems()).toBe(4);
      expect(service.subtotal()).toBe(42.0);
    });

    it('should cap quantity to stock limit if requested quantity exceeds stock', () => {
      service.updateQuantity(1, 10); // Estoque é 5

      expect(service.items()[0].quantity).toBe(5);
    });

    it('should remove item if updated quantity is zero or negative', () => {
      service.updateQuantity(1, 0);

      expect(service.items().length).toBe(0);
      expect(service.isCartVisible()).toBe(false);
    });

    it('should do nothing if updating quantity for a product not in cart', () => {
      service.updateQuantity(999, 3);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].quantity).toBe(2);
    });
  });
});
