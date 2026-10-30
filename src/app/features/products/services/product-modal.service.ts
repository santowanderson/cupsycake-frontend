import { Injectable, signal } from '@angular/core';
import { Product } from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductModalService {
  private readonly _selectedProduct = signal<Product | null>(null);
  private readonly _isOpen = signal<boolean>(false);

  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();

  open(product: Product): void {
    this._selectedProduct.set(product);
    this._isOpen.set(true);
    this.toggleBodyScroll(true);
  }

  close(): void {
    this._isOpen.set(false);
    this.toggleBodyScroll(false);

    // Limpa o produto após a animação de fechamento terminar (300ms)
    setTimeout(() => {
      this._selectedProduct.set(null);
    }, 300);
  }

  private toggleBodyScroll(lock: boolean): void {
    if (lock) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}
