import { TestBed } from '@angular/core/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Product } from '../../../core/models/product.model';
import { ProductModalService } from './product-modal.service';

describe('ProductModalService', () => {
  let service: ProductModalService;

  const mockProduct: Product = {
    id: 1,
    name: 'Cupcake de Chocolate',
    slug: 'cupcake-de-chocolate',
    price: 10.0,
    description: 'Delicioso cupcake de chocolate belga',
    image_url: 'chocolate.jpg',
    stock_quantity: 20,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    tags: [],
  };

  beforeEach(() => {
    // Ativa fake timers para controlar o setTimeout de limpeza do produto após a animação
    jest.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [ProductModalService],
    });

    service = TestBed.inject(ProductModalService);
  });

  afterEach(() => {
    // Restaura os timers reais e limpa alterações globais no body
    jest.useRealTimers();
    document.body.style.overflow = '';
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE ESTADO INICIAL
  // ==========================================
  describe('Initial State', () => {
    it('should initialize with isOpen as false and selectedProduct as null', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.selectedProduct()).toBeNull();
    });
  });

  // ==========================================
  // 2. TESTES DE ABERTURA DO MODAL (open)
  // ==========================================
  describe('Opening Modal', () => {
    it('should set isOpen to true, store the selected product, and lock body scroll', () => {
      service.open(mockProduct);

      expect(service.isOpen()).toBe(true);
      expect(service.selectedProduct()).toEqual(mockProduct);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // ==========================================
  // 3. TESTES DE FECHAMENTO DO MODAL (close)
  // ==========================================
  describe('Closing Modal & Animation Timing', () => {
    it('should set isOpen to false, unlock body scroll immediately, but keep product until timeout completes', () => {
      service.open(mockProduct);
      expect(service.isOpen()).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');

      // Executa o fechamento
      service.close();

      // Verificações imediatas pós-fechamento
      expect(service.isOpen()).toBe(false);
      expect(document.body.style.overflow).toBe('');
      // O produto ainda deve estar disponível para exibir a animação de saída no modal
      expect(service.selectedProduct()).toEqual(mockProduct);

      // Avança o temporizador em 300ms (tempo estipulado para a animação)
      jest.advanceTimersByTime(300);

      // O produto deve ser limpo (null) após o término da animação
      expect(service.selectedProduct()).toBeNull();
    });
  });
});
