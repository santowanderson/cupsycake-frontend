import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ProductService } from '../../features/products/services/product.service';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root',
})
export class CartUrlSyncService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  private isSyncingFromUrl = false;
  private isSyncingFromCart = false;

  constructor() {
    this.setupCartToUrlSync();
  }

  init(): void {
    this.loadCartFromUrl();
    this.setupRouteNavigationSync();
  }

  private loadCartFromUrl(): void {
    const queryParams = this.activatedRoute.snapshot.queryParams;

    const rawProducts = this.productService.products;
    const allProducts =
      typeof rawProducts === 'function' ? rawProducts() : rawProducts || [];

    if (Object.keys(queryParams).length === 0 || allProducts.length === 0)
      return;

    this.isSyncingFromUrl = true;

    for (const [productNameSlug, quantityStr] of Object.entries(queryParams)) {
      const quantity = Number(quantityStr);
      if (isNaN(quantity) || quantity <= 0) continue;

      const foundProduct = allProducts.find(
        (p: any) => this.slugify(p.name) === productNameSlug,
      );

      if (foundProduct) {
        this.cartService.addToCart(foundProduct, quantity);
      }
    }

    this.isSyncingFromUrl = false;
  }

  private setupCartToUrlSync(): void {
    effect(() => {
      const items = this.cartService.items();
      if (this.isSyncingFromUrl) return;

      this.isSyncingFromCart = true;

      // 1. Coleta todos os slugs dos produtos que *ainda estão* no carrinho
      const cartSlugs = new Set(
        items.map((item) => this.slugify(item.product.name)),
      );

      // 2. Mapeia os queryParams atuais da URL
      const currentQueryParams = this.activatedRoute.snapshot.queryParams;

      // 3. Cria um novo objeto de queryParams preservando outros parâmetros (ex: filtros, rastreamento)
      // mas limpando/removendo os produtos que não estão mais no carrinho (atribuindo null ou excluindo)
      const updatedQueryParams: Record<string, any> = { ...currentQueryParams };

      // Identifica e remove da URL os produtos que foram deletados do carrinho
      Object.keys(currentQueryParams).forEach((key) => {
        // Opcional: se quiser filtrar apenas chaves que correspondem a produtos conhecidos,
        // ou simplesmente remover chaves antigas de produtos. Aqui removemos se o produto não está mais no carrinho.
        const allProducts = this.productService.products;
        const productsList =
          typeof allProducts === 'function' ? allProducts() : allProducts || [];
        const isProductKey = productsList.some(
          (p: any) => this.slugify(p.name) === key,
        );

        if (isProductKey && !cartSlugs.has(key)) {
          updatedQueryParams[key] = null; // Definir como null remove o queryParam no Angular Router
        }
      });

      // Adiciona ou atualiza as quantidades dos itens presentes no carrinho
      items.forEach((item) => {
        const slug = this.slugify(item.product.name);
        updatedQueryParams[slug] = item.quantity.toString();
      });

      this.router
        .navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: updatedQueryParams,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .then(() => {
          this.isSyncingFromCart = false;
        });
    });
  }

  private setupRouteNavigationSync(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!this.isSyncingFromCart) {
          const currentQueryParams = this.activatedRoute.snapshot.queryParams;
          const cartQueryParams: Record<string, any> = {
            ...currentQueryParams,
          };

          const items = this.cartService.items();
          const cartSlugs = new Set(
            items.map((item) => this.slugify(item.product.name)),
          );

          // Remove da URL itens que não estão no carrinho durante a navegação
          const allProducts = this.productService.products;
          const productsList =
            typeof allProducts === 'function'
              ? allProducts()
              : allProducts || [];

          Object.keys(currentQueryParams).forEach((key) => {
            const isProductKey = productsList.some(
              (p: any) => this.slugify(p.name) === key,
            );
            if (isProductKey && !cartSlugs.has(key)) {
              cartQueryParams[key] = null;
            }
          });

          items.forEach((item) => {
            cartQueryParams[this.slugify(item.product.name)] =
              item.quantity.toString();
          });

          this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: cartQueryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .trim();
  }
}
