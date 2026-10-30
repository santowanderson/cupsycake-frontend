import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../products/services/product.service';

@Component({
  selector: 'app-cart-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart-detail.component.html',
  styleUrl: './cart-detail.component.css',
})
export class CartDetailComponent {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  protected readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  // Exposição de estados do carrinho
  readonly cartItems = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;

  // Configurações de Checkout
  readonly shippingFee = signal<number>(10.0); // Taxa de frete fixa padrão
  readonly deliveryNotes = signal<string>('');
  readonly shippingAddressId = signal<number>(1); // ID padrão do endereço cadastrado do cliente

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Total geral computado (Subtotal + Frete)
  readonly totalAmount = computed(() => {
    return (
      this.subtotal() + (this.cartItems().length > 0 ? this.shippingFee() : 0)
    );
  });

  formatPrice(price: number | string | undefined): string {
    const numericPrice = Number(price);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  }

  /**
   * Calcula e formata o valor total (preço unitário * quantidade) de um item
   */
  getItemTotal(price: number | string, quantity: number): string {
    const total = Number(price) * quantity;
    return this.formatPrice(total);
  }

  /**
   * Atualiza a quantidade do item somando ou subtraindo o delta (ex: +1 ou -1)
   */
  updateQuantity(productId: number, delta: number): void {
    const item = this.cartItems().find((i) => i.product.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    this.cartService.updateQuantity(productId, newQuantity);
  }

  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  checkout(): void {
    // Validação de autenticação antes de fechar o pedido
    if (!this.authService.currentUser()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/cart' },
      });
      return;
    }

    if (this.cartItems().length === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const orderPayload = {
      shipping_address_id: this.shippingAddressId(),
      shipping_fee: this.shippingFee(),
      notes: this.deliveryNotes(),
      items: this.cartItems().map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.isSubmitting.set(false);
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        console.error('Erro ao finalizar pedido:', err);
        this.errorMessage.set(
          err.error?.error || 'Erro ao processar o pedido. Tente novamente.',
        );
        this.isSubmitting.set(false);
      },
    });
  }
}
