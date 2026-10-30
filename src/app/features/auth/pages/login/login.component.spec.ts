import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthErrorModalComponent } from '../../../../shared/components/ui/auth-error-modal/auth-error-modal.component';
import { LoginComponent } from './login.component';

// Stub local para isolar o modal de erro
@Component({
  selector: 'app-auth-error-modal',
  template: '',
  standalone: true,
})
class AuthErrorModalStubComponent {
  @Input() isOpen: boolean = false;
  @Input() errorMessage: string | null = null;
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authServiceMock: { login: jest.Mock };
  let mockActivatedRoute: { snapshot: { queryParams: Record<string, string> } };

  beforeEach(async () => {
    authServiceMock = {
      login: jest
        .fn()
        .mockReturnValue(of({ success: true, token: 'fake-jwt-token' })),
    };

    mockActivatedRoute = {
      snapshot: {
        queryParams: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    })
      .overrideComponent(LoginComponent, {
        remove: { imports: [AuthErrorModalComponent] },
        add: { imports: [AuthErrorModalStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));

    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // 1. TESTES DE VALIDAÇÃO DO FORMULÁRIO
  // ==========================================
  describe('Form Validation & Controls', () => {
    it('should initialize login form with empty values and be invalid initially', () => {
      expect(component.loginForm.valid).toBe(false);
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('senha')?.value).toBe('');
    });

    it('should validate required fields and email/password format', () => {
      const emailCtrl = component.loginForm.get('email');
      const passCtrl = component.loginForm.get('senha');

      emailCtrl?.setValue('invalid-email');
      expect(emailCtrl?.invalid).toBe(true);

      emailCtrl?.setValue('wanderson@test.com');
      expect(emailCtrl?.valid).toBe(true);

      passCtrl?.setValue('123');
      expect(passCtrl?.invalid).toBe(true);

      passCtrl?.setValue('Password@123');
      expect(passCtrl?.valid).toBe(true);
    });

    it('should identify invalid fields correctly via isFieldInvalid when dirty or touched', () => {
      const emailCtrl = component.loginForm.get('email');

      expect(component.isFieldInvalid('email')).toBe(false);

      emailCtrl?.markAsTouched();
      emailCtrl?.setValue('invalid-email');
      expect(component.isFieldInvalid('email')).toBe(true);

      emailCtrl?.setValue('wanderson@test.com');
      expect(component.isFieldInvalid('email')).toBe(false);
    });
  });

  // ==========================================
  // 2. TESTES DE INTERAÇÃO DE UI
  // ==========================================
  describe('UI Interactions', () => {
    it('should toggle showPassword flag correctly', () => {
      expect(component['showPassword']).toBe(false);

      component.togglePasswordVisibility();
      expect(component['showPassword']).toBe(true);

      component.togglePasswordVisibility();
      expect(component['showPassword']).toBe(false);
    });
  });

  // ==========================================
  // 3. TESTES DE SUBMISSÃO E AUTENTICAÇÃO (onSubmit)
  // ==========================================
  describe('Authentication Workflow (onSubmit)', () => {
    const fillValidForm = () => {
      component.loginForm.setValue({
        email: '   WANDERSON@TEST.COM  ',
        senha: 'Password@123',
      });
    };

    it('should mark form controls as touched and avoid API call if form is invalid', () => {
      const markAllAsTouchedSpy = jest.spyOn(
        component.loginForm,
        'markAllAsTouched',
      );

      component.onSubmit();

      expect(markAllAsTouchedSpy).toHaveBeenCalledTimes(1);
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should sanitize credentials, invoke login, and navigate to home ("/") by default on success', () => {
      fillValidForm();

      component.onSubmit();

      expect(component['isLoading']()).toBe(false);
      expect(authServiceMock.login).toHaveBeenCalledWith({
        email: 'wanderson@test.com',
        password: 'Password@123',
      });
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to returnUrl if provided in queryParams upon successful login', () => {
      mockActivatedRoute.snapshot.queryParams = { returnUrl: '/cart' };
      fillValidForm();

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/cart']);
    });

    it('should handle 401/404 authentication error and open error modal with friendly message without logging to console', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const httpError = Object.assign(new Error('Unauthorized'), {
        status: 401,
      });
      authServiceMock.login.mockReturnValue(throwError(() => httpError));

      fillValidForm();
      component.onSubmit();

      expect(component['isLoading']()).toBe(false);
      expect(component['isModalOpen']()).toBe(true);
      expect(component['errorMessage']()).toBe(
        'E-mail ou senha inválidos. Verifique os dados informados ou cadastre-se.',
      );

      // Valida que o console permaneceu completamente limpo para erros de negócio (401/404)
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle generic server error (500) and display connection error message in modal with infrastructure log', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const httpError = Object.assign(new Error('Server Error'), {
        status: 500,
      });
      authServiceMock.login.mockReturnValue(throwError(() => httpError));

      fillValidForm();
      component.onSubmit();

      expect(component['isLoading']()).toBe(false);
      expect(component['isModalOpen']()).toBe(true);
      expect(component['errorMessage']()).toBe(
        'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
      );

      // Valida o log adequado para falhas reais de infraestrutura
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro crítico de infraestrutura:',
        httpError,
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
