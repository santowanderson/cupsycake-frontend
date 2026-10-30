import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-floating-cart-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './floating-cart-button.component.html',
  styleUrl: './floating-cart-button.component.css',
})
export class FloatingCartButtonComponent {
  protected readonly cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected isModalOpen = signal(false);

  protected noButton = viewChild<ElementRef<HTMLButtonElement>>('noButton');

  protected openModal(): void {
    this.isModalOpen.set(true);
    // Aplica o foco automático no botão "Não" após a renderização do modal
    setTimeout(() => {
      this.noButton()?.nativeElement.focus();
    }, 50);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  navigateToCart(): void {
    // Valida se está logado antes de permitir o redirecionamento para o carrinho
    if (this.authService.validateAuthAndRedirect('/cart')) {
      this.router.navigate(['/cart']);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.closeModal();
    }
  }
}
