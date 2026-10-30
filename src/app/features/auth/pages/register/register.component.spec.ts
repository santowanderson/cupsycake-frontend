import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;
  let authServiceMock: { register: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]), // Necessário para o RouterLink e navegação
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
    it('should initialize the register form with empty or default values and be invalid initially', () => {
      expect(component.registerForm.valid).toBe(false);
      expect(component.registerForm.get('gender')?.value).toBe('NOT_SPECIFIED');
    });

    it('should validate required fields and field constraints properly', () => {
      const firstNameCtrl = component.registerForm.get('first_name');
      firstNameCtrl?.setValue('A'); // Menor que minLength(2)
      expect(firstNameCtrl?.invalid).toBe(true);

      firstNameCtrl?.setValue('Wanderson');
      expect(firstNameCtrl?.valid).toBe(true);
    });

    it('should validate nested address form group controls', () => {
      const zipCodeCtrl = component.registerForm.get('address.zip_code');
      zipCodeCtrl?.setValue('123'); // Inválido
      expect(zipCodeCtrl?.invalid).toBe(true);

      zipCodeCtrl?.setValue('06500-000'); // Válido (padrão 8 dígitos / CEP)
      expect(zipCodeCtrl?.valid).toBe(true);
    });

    it('should correctly identify invalid fields via isFieldInvalid helper when dirty or touched', () => {
      const emailCtrl = component.registerForm.get('email');

      // Não tocado/sujo ainda -> retorna falso mesmo inválido
      expect(component.isFieldInvalid('email')).toBe(false);

      // Marca como touched
      emailCtrl?.markAsTouched();
      emailCtrl?.setValue('invalid-email');
      expect(component.isFieldInvalid('email')).toBe(true);

      // Valor correto
      emailCtrl?.setValue('wanderson@test.com');
      expect(component.isFieldInvalid('email')).toBe(false);
    });

    it('should check nested group field invalidity correctly via isFieldInvalid', () => {
      const cityCtrl = component.registerForm.get('address.city');
      cityCtrl?.markAsTouched();
      cityCtrl?.setValue(''); // Obrigatório vazio

      expect(component.isFieldInvalid('city', 'address')).toBe(true);

      cityCtrl?.setValue('São Paulo');
      expect(component.isFieldInvalid('city', 'address')).toBe(false);
    });
  });

  // ==========================================
  // 2. TESTES DE INTERAÇÃO DE UI (togglePasswordVisibility)
  // ==========================================
  describe('UI Interaction', () => {
    it('should toggle showPassword flag correctly', () => {
      expect(component['showPassword']).toBe(false);

      component.togglePasswordVisibility();
      expect(component['showPassword']).toBe(true);

      component.togglePasswordVisibility();
      expect(component['showPassword']).toBe(false);
    });
  });

  // ==========================================
  // 3. TESTES DE SUBMISSÃO E FLUXO DE CADASTRO (onSubmit)
  // ==========================================
  describe('Form Submission Workflow', () => {
    const fillValidForm = () => {
      component.registerForm.patchValue({
        first_name: 'Wanderson',
        last_name: 'Pereira',
        cpf: '123.456.789-09', // Assumindo formato válido ou bypass do validador customizado
        email: 'wanderson@test.com',
        telefone: '(11) 98765-4321',
        gender: 'MALE',
        birth_date: '2000-01-01',
        password: 'Password@123',
        address: {
          zip_code: '06500-000',
          street_address: 'Rua Principal',
          number: '100',
          complement: 'Apto 101',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state_code: 'SP',
        },
      });
    };

    it('should mark all fields as touched and abort submission if form is invalid', () => {
      const markAllAsTouchedSpy = jest.spyOn(
        component.registerForm,
        'markAllAsTouched',
      );

      component.onSubmit();

      expect(markAllAsTouchedSpy).toHaveBeenCalledTimes(1);
      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should format payload correctly and navigate to login with registered queryParam on success', () => {
      fillValidForm();

      component.onSubmit();

      expect(component['isLoading']()).toBe(false);
      expect(authServiceMock.register).toHaveBeenCalledTimes(1);

      // Validação do payload tratado (limpeza de máscara de telefone, CPF, CEP, uppercase no estado e mapeamento do state_name)
      expect(authServiceMock.register).toHaveBeenCalledWith({
        first_name: 'Wanderson',
        last_name: 'Pereira',
        cpf: '12345678909',
        email: 'wanderson@test.com',
        area_code: '11',
        phone_number: '987654321',
        gender: 'MALE',
        birth_date: '2000-01-01',
        password: 'Password@123',
        address: {
          zip_code: '06500000',
          street_address: 'Rua Principal',
          number: '100',
          complement: 'Apto 101',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state_code: 'SP',
          state_name: 'São Paulo', // Mapeado via getStateName('SP')
        },
      });

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { registered: 'true' },
      });
    });

    it('should handle 400/409 registration error response and set specific error message', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          status: 409,
          error: { error: 'E-mail já cadastrado.' },
        })),
      );

      fillValidForm();
      component.onSubmit();

      expect(component['isLoading']()).toBe(false);
      expect(component['errorMessage']()).toBe('E-mail já cadastrado.');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle fallback error message on 400/409 if error body is empty', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      authServiceMock.register.mockReturnValue(
        throwError(() => ({ status: 400, error: {} })),
      );

      fillValidForm();
      component.onSubmit();

      expect(component['errorMessage']()).toBe(
        'Este e-mail ou CPF já está cadastrado no sistema.',
      );
    });

    it('should handle generic server errors (status 500) and set connection error message', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      authServiceMock.register.mockReturnValue(
        throwError(() => ({ status: 500 })),
      );

      fillValidForm();
      component.onSubmit();

      expect(component['errorMessage']()).toBe(
        'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
      );
    });
  });
});
