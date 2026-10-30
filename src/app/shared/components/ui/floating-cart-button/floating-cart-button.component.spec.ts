import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { FloatingCartButtonComponent } from './floating-cart-button.component';

describe('FloatingCartButtonComponent', () => {
  let component: FloatingCartButtonComponent;
  let fixture: ComponentFixture<FloatingCartButtonComponent>;
  let authServiceMock: { validateAuthAndRedirect: jest.Mock };
  let routerMock: { navigate: jest.Mock };
  let cartServiceMock: { isCartVisible: jest.Mock };

  beforeEach(async () => {
    // Mock dos serviços dependentes
    authServiceMock = {
      validateAuthAndRedirect: jest.fn(),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    cartServiceMock = {
      isCartVisible: jest.fn().mockReturnValue(false), // Mock do Signal/Método utilizado no template
    };

    await TestBed.configureTestingModule({
      imports: [FloatingCartButtonComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingCartButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize isModalOpen signal as false', () => {
    expect((component as any).isModalOpen()).toBe(false);
  });

  it('should open the modal and update isModalOpen signal to true', () => {
    (component as any).openModal();
    expect((component as any).isModalOpen()).toBe(true);
  });

  it('should close the modal and update isModalOpen signal to false', () => {
    (component as any).openModal();
    expect((component as any).isModalOpen()).toBe(true);

    (component as any).closeModal();
    expect((component as any).isModalOpen()).toBe(false);
  });

  it('should navigate to /cart if authentication validation succeeds', () => {
    authServiceMock.validateAuthAndRedirect.mockReturnValue(true);

    component.navigateToCart();

    expect(authServiceMock.validateAuthAndRedirect).toHaveBeenCalledWith(
      '/cart',
    );
    expect(routerMock.navigate).toHaveBeenCalledWith(['/cart']);
  });

  it('should not navigate to /cart if authentication validation fails', () => {
    authServiceMock.validateAuthAndRedirect.mockReturnValue(false);

    component.navigateToCart();

    expect(authServiceMock.validateAuthAndRedirect).toHaveBeenCalledWith(
      '/cart',
    );
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should close the modal when Enter keydown event occurs', () => {
    (component as any).openModal();
    expect((component as any).isModalOpen()).toBe(true);

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    (component as any).onKeyDown(enterEvent);

    expect((component as any).isModalOpen()).toBe(false);
  });

  it('should not close the modal when a non-Enter keydown event occurs', () => {
    (component as any).openModal();
    expect((component as any).isModalOpen()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    (component as any).onKeyDown(escapeEvent);

    expect((component as any).isModalOpen()).toBe(true);
  });
});
