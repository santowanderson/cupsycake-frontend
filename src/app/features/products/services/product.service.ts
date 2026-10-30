import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly apiUrl = environment.apiUrl;

  readonly products = signal<Product[]>([]);
  readonly activeTagFilters = signal<string[]>([]);
  readonly currentPage = signal<number>(1);

  constructor() {
    this.fetchProducts();
    this.initQueryParamsSync();
  }

  private fetchProducts(): void {
    this.http.get<Product[]>(this.apiUrl + '/api/products').subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Erro ao carregar produtos:', err),
    });
  }

  /**
   * Sincroniza o estado interno (tags e paginação) com os QueryParams da URL.
   * Garante suporte a recarregamento de página e compartilhamento de URL.
   */
  private initQueryParamsSync(): void {
    this.route.queryParamMap.subscribe((params) => {
      // Tratamento das Tags (aceita string única ou array no param 'tags')
      const tagParam = params.getAll('tag');
      this.activeTagFilters.set(tagParam);

      // Tratamento da Página Atual
      const pageParam = params.get('page');
      const parsedPage = pageParam ? Number(pageParam) : 1;
      this.currentPage.set(
        !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1,
      );
    });
  }

  /**
   * Atualiza os QueryParams na URL, refletindo o estado atual de filtros e página.
   */
  private updateQueryParams(): void {
    const filters = this.activeTagFilters();
    const page = this.currentPage();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tag: filters.length > 0 ? filters : null,
        page: page > 1 ? page : null, // Oculta o param 'page=1' para manter a URL limpa
      },
      queryParamsHandling: 'merge',
    });
  }

  toggleTagFilter(tagSlug: string): void {
    this.activeTagFilters.update((filters) => {
      const updatedFilters = filters.includes(tagSlug)
        ? filters.filter((f) => f !== tagSlug)
        : [...filters, tagSlug];

      return updatedFilters;
    });

    // Sempre que o filtro mudar, resetamos para a primeira página e atualizamos a URL
    this.currentPage.set(1);
    this.updateQueryParams();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.updateQueryParams();
  }

  isTagActive(tagSlug: string): boolean {
    return this.activeTagFilters().includes(tagSlug);
  }

  readonly filteredProducts = computed(() => {
    const list = this.products();
    const filters = this.activeTagFilters();

    if (filters.length === 0) return list;

    return list.filter((product) =>
      filters.every((filterSlug) =>
        product.tags.some((t) => t.slug === filterSlug),
      ),
    );
  });

  /**
   * Função reutilizável que retorna o caminho completo da imagem do produto.
   */
  getImageUrl(productOrImage: Product | string | null | undefined): string {
    if (!productOrImage) {
      return 'assets/images/placeholder.jpg';
    }

    let rawValue = '';

    if (typeof productOrImage === 'string') {
      rawValue = productOrImage.trim();
    } else if (productOrImage.image_url) {
      rawValue = productOrImage.image_url.trim();
    } else if (productOrImage.slug) {
      rawValue = `${productOrImage.slug}.jpg`;
    }

    if (!rawValue) {
      return 'assets/images/placeholder.jpg';
    }

    if (
      rawValue.startsWith('http://') ||
      rawValue.startsWith('https://') ||
      rawValue.startsWith('assets/')
    ) {
      return rawValue;
    }

    const cleanName = rawValue.replace(/^\/+/, '');

    if (cleanName.startsWith('assets/')) {
      return cleanName;
    }

    return `assets/images/${cleanName}`;
  }
}
