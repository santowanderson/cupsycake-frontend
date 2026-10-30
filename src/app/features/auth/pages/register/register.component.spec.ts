import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values and invalid state', () => {
    expect(component.registerForm.valid).toBeFalsy();
    expect(component.registerForm.get('first_name')?.value).toBe('');
    expect(component.registerForm.get('cpf')?.value).toBe('');
    expect(component.registerForm.get('telefone')?.value).toBe('');
    expect(component.registerForm.get('address.zip_code')?.value).toBe('');
  });

  describe('Mask and Validation Methods', () => {
    it('should format phone number correctly on input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '11988887777';
      const event = { target: inputElement } as unknown as Event;

      component.onPhoneInput(event);

      expect(component.registerForm.get('telefone')?.value).toBe(
        '(11) 98888-7777',
      );
      expect(component.registerForm.get('telefone')?.valid).toBeTruthy();
    });

    it('should format CPF correctly on input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '12345678909';
      const event = { target: inputElement } as unknown as Event;

      component.onCpfInput(event);

      expect(component.registerForm.get('cpf')?.value).toBe('123.456.789-09');
    });

    it('should format CEP correctly on input and validate pattern', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '01001000';
      const event = { target: inputElement } as unknown as Event;

      component.onZipCodeInput(event);

      expect(component.registerForm.get('address.zip_code')?.value).toBe(
        '01001-000',
      );
      expect(
        component.registerForm.get('address.zip_code')?.valid,
      ).toBeTruthy();
    });

    it('should invalidate incorrect zip_code format', () => {
      component.registerForm.get('address.zip_code')?.setValue('1234567');
      expect(
        component.registerForm.get('address.zip_code')?.invalid,
      ).toBeTruthy();
    });

    it('should invalidate incorrect telefone format', () => {
      component.registerForm.get('telefone')?.setValue('1198888777'); // Faltando dígito
      expect(component.registerForm.get('telefone')?.invalid).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should mark all fields as touched and not call authService if form is invalid', () => {
      component.onSubmit();

      expect(component.registerForm.invalid).toBeTruthy();
      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should call authService.register with clean payload when form is valid', () => {
      // Preenchendo com dados válidos formatados conforme exigido pelas regras e máscaras
      component.registerForm.patchValue({
        first_name: 'Wanderson',
        last_name: 'Pereira',
        cpf: '529.982.247-25', // CPF válido com dígito verificador correto
        email: 'wanderson@exemplo.com',
        telefone: '(11) 98888-7777',
        gender: 'MALE',
        birth_date: '2000-01-01',
        password: 'Password@123',
        address: {
          zip_code: '01001-000',
          street_address: 'Praça da Sé',
          number: '100',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state_code: 'SP',
        },
      });

      expect(component.registerForm.valid).toBeTruthy();

      component.onSubmit();

      expect(authServiceMock.register).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Wanderson',
          last_name: 'Pereira',
          cpf: '52998224725',
          email: 'wanderson@exemplo.com',
          phone_number: '988887777',
          area_code: '11',
          address: expect.objectContaining({
            zip_code: '01001000',
            state_code: 'SP',
            state_name: 'São Paulo',
          }),
        }),
      );
    });

    it('should set error message if registration fails with 400/409', () => {
      authServiceMock.register.mockReturnValue(
        throwError(() => ({
          status: 409,
          error: { error: 'E-mail já cadastrado' },
        })),
      );

      component.registerForm.patchValue({
        first_name: 'Wanderson',
        last_name: 'Pereira',
        cpf: '529.982.247-25',
        email: 'wanderson@exemplo.com',
        telefone: '(11) 98888-7777',
        gender: 'MALE',
        birth_date: '2000-01-01',
        password: 'Password@123',
        address: {
          zip_code: '01001-000',
          street_address: 'Praça da Sé',
          number: '100',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state_code: 'SP',
        },
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('E-mail já cadastrado');
    });
  });
});
