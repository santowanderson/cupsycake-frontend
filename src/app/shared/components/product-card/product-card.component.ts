import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ProductModalService } from '../../../features/products/services/product-modal.service';
import { ProductService } from '../../../features/products/services/product.service';
import { ProductTagBadgeComponent } from '../product-tag-badge/product-tag-badge.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  imports: [CurrencyPipe, ProductTagBadgeComponent],
})
export class ProductCardComponent {
  readonly product = input.required<Product>();

  private readonly cartService = inject(CartService);
  protected readonly productService = inject(ProductService);
  private readonly productModalService = inject(ProductModalService);
  isAdding: boolean = false;

  openModal(): void {
    // Invoca o sinal product() para acessar o valor atual
    this.productModalService.open(this.product());
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    if (this.isAdding) return;

    this.isAdding = true;
    this.cartService.addToCart(this.product(), 1);

    setTimeout(() => {
      this.isAdding = false;
    }, 1000);
  }
}
