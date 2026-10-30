import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ProductModalService } from '../../../features/products/services/product-modal.service';
import { ProductService } from '../../../features/products/services/product.service';
import { ProductModalComponent } from './product-modal.component';

describe('ProductModalComponent', () => {
  let component: ProductModalComponent;
  let fixture: ComponentFixture<ProductModalComponent>;
  let modalServiceMock: {
    close: jest.Mock;
    isOpen: jest.Mock;
    selectedProduct: jest.Mock;
  };
  let productServiceMock: { getImageUrl: jest.Mock };

  beforeEach(async () => {
    // Ativa fake timers para controlar o setTimeout de fechamento do modal de forma previsível
    jest.useFakeTimers();

    modalServiceMock = {
      close: jest.fn(),
      isOpen: jest.fn().mockReturnValue(true),
      selectedProduct: jest.fn().mockReturnValue({
        id: 1,
        name: 'Cupcake de Chocolate',
        price: 10,
        description: 'Delicioso cupcake recheado',
      }), // Mock do signal/método selectedProduct utilizado no template
    };

    productServiceMock = {
      getImageUrl: jest
        .fn()
        .mockReturnValue('http://localhost:3000/images/cupcake.png'),
    };

    await TestBed.configureTestingModule({
      imports: [ProductModalComponent],
      providers: [
        { provide: ProductModalService, useValue: modalServiceMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Restaura os timers reais após cada teste
    jest.useRealTimers();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE FECHAMENTO E ANIMAÇÃO (closeModal)
  // ==========================================
  describe('Modal Closing & Animations', () => {
    it('should set isClosing to true immediately when closeModal is called', () => {
      component.closeModal();
      expect(component.isClosing).toBe(true);
    });

    it('should call modalService.close() and reset isClosing after 250ms timeout', () => {
      component.closeModal();
      expect(component.isClosing).toBe(true);
      expect(modalServiceMock.close).not.toHaveBeenCalled();

      // Avança o tempo do temporizador em 250ms
      jest.advanceTimersByTime(250);

      expect(modalServiceMock.close).toHaveBeenCalledTimes(1);
      expect(component.isClosing).toBe(false);
    });
  });

  // ==========================================
  // 2. TESTES DE INTERAÇÃO COM BACKDROP (onBackdropClick)
  // ==========================================
  describe('Backdrop Click Interaction', () => {
    it('should trigger closeModal when onBackdropClick is invoked', () => {
      const closeModalSpy = jest.spyOn(component, 'closeModal');

      component.onBackdropClick();

      expect(closeModalSpy).toHaveBeenCalledTimes(1);
      expect(component.isClosing).toBe(true);
    });
  });

  // ==========================================
  // 3. TESTES DE RECUPERAÇÃO DE IMAGEM (getImageUrl)
  // ==========================================
  describe('Product Image URL Resolution', () => {
    it('should delegate image URL resolution to ProductService', () => {
      const mockProduct = { id: 1, name: 'Cupcake de Chocolate' };
      const url = component.getImageUrl(mockProduct);

      expect(productServiceMock.getImageUrl).toHaveBeenCalledWith(mockProduct);
      expect(url).toBe('http://localhost:3000/images/cupcake.png');
    });
  });
});
