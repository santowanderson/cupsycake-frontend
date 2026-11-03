import { Injectable, signal } from '@angular/core';
import { Product } from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
class ProductModalService {
  private readonly _selectedProduct = signal<Product | null>(null);
  private readonly _isOpen = signal<boolean>(false);
  private readonly _isClosing = signal<boolean>(false);

  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();
  readonly isClosing = this._isClosing.asReadonly();

  open(product: Product): void {
    // Se já estiver fechando ou aberto, garante reset limpo antes de abrir o novo
    this._isClosing.set(false);
    this._selectedProduct.set(product);
    this._isOpen.set(true);
    this.toggleBodyScroll(true);
  }

  close(): void {
    if (this._isClosing() || !this._isOpen()) return;

    this._isClosing.set(true);

    // Tempo correspondente à duração máxima da animação CSS de fechamento (ex: 250ms-300ms)
    setTimeout(() => {
      this._isOpen.set(false);
      this._isClosing.set(false);
      this._selectedProduct.set(null);
      this.toggleBodyScroll(false);
    }, 250);
  }

  private toggleBodyScroll(lock: boolean): void {
    document.body.style.overflow = lock ? 'hidden' : '';
  }
}

export { ProductModalService };
