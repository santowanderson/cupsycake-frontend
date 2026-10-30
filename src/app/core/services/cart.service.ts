import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  readonly items = signal<CartItem[]>([]);

  readonly isCartVisible = computed(() => this.totalItems() > 0);

  readonly totalItems = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantity, 0),
  );

  readonly subtotal = computed(() =>
    this.items().reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    ),
  );

  addToCart(product: Product, quantity: number = 1): void {
    // Normaliza o produto garantindo que o preço seja um número
    const normalizedProduct: Product = {
      ...product,
      price: Number(product.price),
    };

    this.items.update((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (i) => i.product.id === normalizedProduct.id,
      );
      if (existingIndex > -1) {
        const updated = [...currentItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, normalizedProduct.stock_quantity ?? 999),
        };
        return updated;
      }
      return [
        ...currentItems,
        {
          product: normalizedProduct,
          quantity: Math.min(quantity, normalizedProduct.stock_quantity ?? 999),
        },
      ];
    });
  }

  removeFromCart(productId: number): void {
    this.items.update((items) =>
      items.filter((i) => i.product.id !== productId),
    );
  }

  clearCart(): void {
    this.items.set([]);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.items.update((currentItems) =>
      currentItems.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock_quantity ?? 999;
          const validQty = Math.min(quantity, maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      }),
    );
  }
}
