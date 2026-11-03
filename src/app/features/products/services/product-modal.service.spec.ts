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
    // Ativa fake timers para controlar o setTimeout de limpeza do produto e animação
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
    it('should initialize with isOpen as false, isClosing as false, and selectedProduct as null', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.isClosing()).toBe(false);
      expect(service.selectedProduct()).toBeNull();
    });
  });

  // ==========================================
  // 2. TESTES DE ABERTURA DO MODAL (open)
  // ==========================================
  describe('Opening Modal', () => {
    it('should set isOpen to true, isClosing to false, store the selected product, and lock body scroll', () => {
      service.open(mockProduct);

      expect(service.isOpen()).toBe(true);
      expect(service.isClosing()).toBe(false);
      expect(service.selectedProduct()).toEqual(mockProduct);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // ==========================================
  // 3. TESTES DE FECHAMENTO E ANIMAÇÃO (close)
  // ==========================================
  describe('Closing Modal & Animation Timing', () => {
    it('should set isClosing to true immediately while keeping isOpen true, product stored, and body scroll locked until timeout completes', () => {
      service.open(mockProduct);
      expect(service.isOpen()).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');

      // Aciona o fechamento
      service.close();

      // Verificações imediatas durante a animação de saída
      expect(service.isClosing()).toBe(true);
      expect(service.isOpen()).toBe(true);
      expect(service.selectedProduct()).toEqual(mockProduct);
      expect(document.body.style.overflow).toBe('hidden');

      // Avança o temporizador em 250ms (tempo estipulado para a animação)
      jest.advanceTimersByTime(250);

      // Após o término do timeout, o modal é totalmente desmontado
      expect(service.isOpen()).toBe(false);
      expect(service.isClosing()).toBe(false);
      expect(service.selectedProduct()).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });
  });
});
