import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ProductModalService } from '../../../features/products/services/product-modal.service';
import { ProductService } from '../../../features/products/services/product.service';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  let cartServiceMock: { addToCart: jest.Mock };
  let productModalServiceMock: { open: jest.Mock };
  let productServiceMock: { getImageUrl: jest.Mock };

  const mockProduct: Product = {
    id: 1,
    name: 'Cupcake Gourmet de Chocolate',
    slug: 'cupcake-gourmet-de-chocolate',
    price: 12.5,
    description: 'Delicioso cupcake artesanal',
    image_url: 'cupcake.png',
    stock_quantity: 10,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    tags: [],
  };

  beforeEach(async () => {
    // Ativa fake timers para controlar o setTimeout de controle de clique duplo de forma previsível
    jest.useFakeTimers();

    cartServiceMock = {
      addToCart: jest.fn(),
    };

    productModalServiceMock = {
      open: jest.fn(),
    };

    productServiceMock = {
      getImageUrl: jest
        .fn()
        .mockReturnValue('http://localhost:3000/images/cupcake.png'),
    };

    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        { provide: CartService, useValue: cartServiceMock },
        { provide: ProductModalService, useValue: productModalServiceMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;

    // Atribui o input obrigatório via setInput do ComponentRef para Signals do Angular 17
    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Restaura os temporizadores reais após cada teste
    jest.useRealTimers();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE INTERAÇÃO COM MODAL (openModal)
  // ==========================================
  describe('Modal Interaction', () => {
    it('should call productModalService.open with the current product signal value when openModal is triggered', () => {
      component.openModal();

      expect(productModalServiceMock.open).toHaveBeenCalledTimes(1);
      expect(productModalServiceMock.open).toHaveBeenCalledWith(mockProduct);
    });
  });

  // ==========================================
  // 2. TESTES DE ADIÇÃO AO CARRINHO (addToCart)
  // ==========================================
  describe('Cart Addition & Debounce Logic', () => {
    it('should stop event propagation, set isAdding to true, and add product to cart with quantity 1', () => {
      const mockEvent = { stopPropagation: jest.fn() } as unknown as Event;

      component.addToCart(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(component.isAdding).toBe(true);
      expect(cartServiceMock.addToCart).toHaveBeenCalledTimes(1);
      expect(cartServiceMock.addToCart).toHaveBeenCalledWith(mockProduct, 1);
    });

    it('should prevent execution if isAdding is already true (double-click guard)', () => {
      const mockEvent = { stopPropagation: jest.fn() } as unknown as Event;

      component.isAdding = true;
      component.addToCart(mockEvent);

      expect(cartServiceMock.addToCart).not.toHaveBeenCalled();
    });

    it('should reset isAdding to false after 1000ms timeout', () => {
      const mockEvent = { stopPropagation: jest.fn() } as unknown as Event;

      component.addToCart(mockEvent);
      expect(component.isAdding).toBe(true);

      // Avança o tempo do temporizador em exatos 1000ms
      jest.advanceTimersByTime(1000);

      expect(component.isAdding).toBe(false);
    });
  });

  // ==========================================
  // 3. TESTES DE REATIVIDADE DO INPUT SIGNAL (product)
  // ==========================================
  describe('Input Signal Reactivity', () => {
    it('should update component state and operations when product signal changes', () => {
      const updatedProduct: Product = {
        ...mockProduct,
        id: 2,
        name: 'Cupcake de Morango',
        price: 15.0,
      };

      // Atualiza o signal utilizando setInput
      fixture.componentRef.setInput('product', updatedProduct);
      fixture.detectChanges();

      expect(component.product()).toEqual(updatedProduct);

      // Testa se o modal recebe o novo produto atualizado
      component.openModal();
      expect(productModalServiceMock.open).toHaveBeenCalledWith(updatedProduct);
    });
  });
});
