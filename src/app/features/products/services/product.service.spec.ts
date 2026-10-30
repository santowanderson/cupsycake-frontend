import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../core/models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  let apiUrl = environment.apiUrl;

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Cupcake de Chocolate',
      slug: 'cupcake-de-chocolate',
      price: 10.0,
      description: 'Delicioso cupcake de chocolate belga',
      image_url: 'chocolate.jpg',
      stock_quantity: 20,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      tags: [
        { id: 1, name: 'Chocolate', slug: 'chocolate' },
        { id: 2, name: 'Sem Glúten', slug: 'sem-gluten' },
      ],
    },
    {
      id: 2,
      name: 'Cupcake de Morango',
      slug: 'cupcake-de-morango',
      price: 12.0,
      description: 'Cupcake recheado com morango fresco',
      image_url: 'morango.jpg',
      stock_quantity: 15,
      is_active: true,
      created_at: '2026-01-02T00:00:00Z',
      tags: [{ id: 3, name: 'Frutas', slug: 'frutas' }],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]), // Necessário para injetar Router e ActivatedRoute no serviço
      ],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);

    const initialRequest = httpMock.expectOne(apiUrl + '/api/products');
    initialRequest.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE REQUISIÇÕES HTTP
  // ==========================================
  describe('HTTP Operations', () => {
    it('should fetch products successfully and update products signal', () => {
      // Como o construtor chama o fetch automaticamente, limpamos ou testamos uma nova chamada
      service['fetchProducts']();

      const req = httpMock.expectOne(apiUrl + '/api/products');
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);

      expect(service.products()).toEqual(mockProducts);
    });

    it('should handle fetchProducts error gracefully and log to console.error', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      service['fetchProducts']();

      const req = httpMock.expectOne(apiUrl + '/api/products');
      req.error(new ProgressEvent('error'), {
        status: 500,
        statusText: 'Server Error',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao carregar produtos:',
        expect.any(Object),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // 2. TESTES DE FILTRAGEM E GESTÃO DE TAGS (SIGNALS)
  // ==========================================
  describe('Tag Filtering & Reactive Signals', () => {
    beforeEach(() => {
      service['products'].set(mockProducts);
    });

    it('should toggle tag filters correctly (add and remove slugs) and reset page to 1', () => {
      expect(service.activeTagFilters()).toEqual([]);

      service.setPage(3);
      expect(service.currentPage()).toBe(3);

      // Adiciona tag (deve resetar a página para 1)
      service.toggleTagFilter('chocolate');
      expect(service.activeTagFilters()).toEqual(['chocolate']);
      expect(service.isTagActive('chocolate')).toBe(true);
      expect(service.currentPage()).toBe(1);

      // Adiciona segunda tag
      service.toggleTagFilter('sem-gluten');
      expect(service.activeTagFilters()).toEqual(['chocolate', 'sem-gluten']);

      // Remove a primeira tag (toggle off)
      service.toggleTagFilter('chocolate');
      expect(service.activeTagFilters()).toEqual(['sem-gluten']);
      expect(service.isTagActive('chocolate')).toBe(false);
    });

    it('should return all products when no filters are active', () => {
      expect(service.activeTagFilters()).toEqual([]);
      expect(service.filteredProducts()).toEqual(mockProducts);
    });

    it('should filter products correctly matching active tag filters', () => {
      service.toggleTagFilter('chocolate');

      expect(service.filteredProducts()).toEqual([mockProducts[0]]);
    });

    it('should return empty list if no product matches all active tag filters', () => {
      service.toggleTagFilter('chocolate');
      service.toggleTagFilter('frutas');

      expect(service.filteredProducts()).toEqual([]);
    });
  });

  // ==========================================
  // 3. TESTES DE NORMALIZAÇÃO DE URL DE IMAGEM
  // ==========================================
  describe('getImageUrl Utility', () => {
    it('should return placeholder when input is null, undefined, or empty', () => {
      expect(service.getImageUrl(null)).toBe('assets/images/placeholder.jpg');
      expect(service.getImageUrl(undefined)).toBe(
        'assets/images/placeholder.jpg',
      );
      expect(service.getImageUrl('')).toBe('assets/images/placeholder.jpg');
      expect(service.getImageUrl({} as Product)).toBe(
        'assets/images/placeholder.jpg',
      );
    });

    it('should return string input directly if it is a full HTTP/HTTPS URL or starts with assets/', () => {
      expect(service.getImageUrl('http://example.com/image.jpg')).toBe(
        'http://example.com/image.jpg',
      );
      expect(service.getImageUrl('https://example.com/image.png')).toBe(
        'https://example.com/image.png',
      );
      expect(service.getImageUrl('assets/images/custom.jpg')).toBe(
        'assets/images/custom.jpg',
      );
    });

    it('should sanitize leading slashes and prepend assets/images/ for relative image names', () => {
      expect(service.getImageUrl('/cupcake.jpg')).toBe(
        'assets/images/cupcake.jpg',
      );
      expect(service.getImageUrl('    /gourmet.png    ')).toBe(
        'assets/images/gourmet.png',
      );
      expect(service.getImageUrl('cupcake-vanilla.jpg')).toBe(
        'assets/images/cupcake-vanilla.jpg',
      );
    });

    it('should extract image_url from product object correctly', () => {
      const prodWithImg: Product = {
        ...mockProducts[0],
        image_url: '/custom-choco.jpg',
      };
      expect(service.getImageUrl(prodWithImg)).toBe(
        'assets/images/custom-choco.jpg',
      );
    });

    it('should fall back to slug as filename if image_url is missing on product object', () => {
      const prodWithoutImg: Product = {
        ...mockProducts[0],
        image_url: '',
        slug: 'red-velvet-cupcake',
      };
      expect(service.getImageUrl(prodWithoutImg)).toBe(
        'assets/images/red-velvet-cupcake.jpg',
      );
    });

    it('should handle string parameters directly', () => {
      expect(service.getImageUrl('  /bolo.jpg ')).toBe(
        'assets/images/bolo.jpg',
      );
    });
  });
});
