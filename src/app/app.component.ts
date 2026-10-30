import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartUrlSyncService } from './core/services/cart-url-sync.service';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { ProductModalComponent } from './shared/components/product-modal/product-modal.component';
import { FloatingCartButtonComponent } from './shared/components/ui/floating-cart-button/floating-cart-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    RouterOutlet,
    ProductModalComponent,
    FloatingCartButtonComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly cartUrlSyncService = inject(CartUrlSyncService);
  title = 'cupsycake-frontend';

  ngOnInit(): void {
    this.cartUrlSyncService.init();
  }
}
