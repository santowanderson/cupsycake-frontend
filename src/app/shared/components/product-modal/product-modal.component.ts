import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProductModalService } from '../../../features/products/services/product-modal.service';
import { ProductService } from '../../../features/products/services/product.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.css'],
})
export class ProductModalComponent {
  readonly modalService = inject(ProductModalService);
  private readonly productService = inject(ProductService);

  isClosing = false;

  closeModal(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.modalService.close();
      this.isClosing = false;
    }, 250);
  }

  onBackdropClick(): void {
    this.closeModal();
  }

  getImageUrl(product: any): string {
    return this.productService.getImageUrl(product);
  }
}
