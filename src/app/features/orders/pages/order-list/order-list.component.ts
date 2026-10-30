import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../../core/models/order.model';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../products/services/product.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css',
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  protected readonly productService = inject(ProductService);

  // Estados reativos
  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedYear = signal<string>('ALL');

  // Anos disponíveis extraídos dinamicamente dos pedidos realizados
  readonly availableYears = computed(() => {
    const years = this.orders().map((order) =>
      new Date(order.created_at).getFullYear().toString(),
    );
    return [
      'ALL',
      ...Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a)),
    ];
  });

  // Pedidos filtrados com base no ano selecionado
  readonly filteredOrders = computed(() => {
    const year = this.selectedYear();
    if (year === 'ALL') {
      return this.orders();
    }
    return this.orders().filter(
      (order) => new Date(order.created_at).getFullYear().toString() === year,
    );
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar pedidos:', err);
        this.errorMessage.set(
          'Não foi possível carregar seus pedidos. Tente novamente mais tarde.',
        );
        this.isLoading.set(false);
      },
    });
  }

  filterByYear(year: string): void {
    this.selectedYear.set(year);
  }

  formatPrice(price: number | string): string {
    const num = Number(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  imageUrl(id: number) {
    const imagePath = this.productService
      .products()
      .find((item) => item.id === id)?.image_url;
    return 'assets/images/' + imagePath;
  }
}
