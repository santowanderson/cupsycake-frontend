import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceMock: {
    logout: jest.Mock;
    isAuthenticated: jest.Mock;
    currentUser: jest.Mock;
  };

  beforeEach(async () => {
    authServiceMock = {
      logout: jest.fn().mockReturnValue(of({ success: true })),
      isAuthenticated: jest.fn().mockReturnValue(true),
      currentUser: jest
        .fn()
        .mockReturnValue({ name: 'Wanderson', email: 'wanderson@test.com' }), // Mock do signal/método currentUser utilizado no template
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]), // Necessário devido à diretiva RouterLink
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE GERENCIAMENTO DO DROPDOWN
  // ==========================================
  describe('Dropdown Menu Toggle & State', () => {
    it('should initialize with dropdown closed (false)', () => {
      expect(component['isDropdownOpen']()).toBe(false);
    });

    it('should toggle dropdown state and stop event propagation when toggleDropdown is called', () => {
      const mockEvent = { stopPropagation: jest.fn() } as unknown as Event;

      // Abre o dropdown
      component.toggleDropdown(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(component['isDropdownOpen']()).toBe(true);

      // Fecha o dropdown novamente
      component.toggleDropdown(mockEvent);
      expect(component['isDropdownOpen']()).toBe(false);
    });

    it('should close dropdown explicitly when closeDropdown is called', () => {
      component['isDropdownOpen'].set(true);
      expect(component['isDropdownOpen']()).toBe(true);

      component.closeDropdown();
      expect(component['isDropdownOpen']()).toBe(false);
    });

    it('should close dropdown when a document click occurs (@HostListener)', () => {
      component['isDropdownOpen'].set(true);
      expect(component['isDropdownOpen']()).toBe(true);

      component.onDocumentClick();
      expect(component['isDropdownOpen']()).toBe(false);
    });
  });

  // ==========================================
  // 2. TESTES DE LOGOUT E INTEGRAÇÃO COM AUTH
  // ==========================================
  describe('Logout Workflow', () => {
    it('should close dropdown and call authService.logout successfully', () => {
      component['isDropdownOpen'].set(true);

      component.logout();

      expect(component['isDropdownOpen']()).toBe(false);
      expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    });

    it('should handle logout errors gracefully without breaking execution', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      authServiceMock.logout.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      component.logout();

      expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao realizar logout:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
