import { FormControl } from '@angular/forms';
import { describe, expect, it } from '@jest/globals';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {
  // ==========================================
  // 1. TESTES DE VALIDAÇÃO DE E-MAIL
  // ==========================================
  describe('emailValidator', () => {
    const validator = CustomValidators.emailValidator();

    it('should return null for empty, null, or whitespace values', () => {
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl('   '))).toBeNull();
    });

    it('should return null for valid email formats', () => {
      expect(validator(new FormControl('cliente@exemplo.com'))).toBeNull();
      expect(
        validator(new FormControl('usuario.nome+tag@sub.domain.com.br')),
      ).toBeNull();
    });

    it('should return { invalidEmail: true } for invalid email formats', () => {
      expect(validator(new FormControl('email-sem-arroba.com'))).toEqual({
        invalidEmail: true,
      });
      expect(validator(new FormControl('usuario@'))).toEqual({
        invalidEmail: true,
      });
      expect(validator(new FormControl('usuario@dominio'))).toEqual({
        invalidEmail: true,
      });
    });
  });

  // ==========================================
  // 2. TESTES DE VALIDAÇÃO DE SENHA FORTE
  // ==========================================
  describe('passwordValidator', () => {
    const validator = CustomValidators.passwordValidator();

    it('should return null for empty or null values', () => {
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });

    it('should return null for strong passwords meeting all criteria', () => {
      expect(validator(new FormControl('Cupcake@2026'))).toBeNull();
    });

    it('should return detailed passwordStrength error object when password lacks criteria', () => {
      const control = new FormControl('fraca');
      const result = validator(control);

      expect(result).toEqual({
        passwordStrength: {
          hasMinLength: false,
          hasUpperCase: false,
          hasLowerCase: true,
          hasNumeric: false,
          hasSpecialChar: false,
        },
      });
    });
  });

  // ==========================================
  // 3. TESTES DE VALIDAÇÃO DE CPF
  // ==========================================
  describe('cpfValidator', () => {
    const validator = CustomValidators.cpfValidator();

    it('should return null for empty or null values', () => {
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });

    it('should return { invalidCpf: true } when CPF length is incorrect', () => {
      expect(validator(new FormControl('1234567890'))).toEqual({
        invalidCpf: true,
      });
    });

    it('should return { invalidCpf: true } for CPFs with all repeating digits', () => {
      expect(validator(new FormControl('111.111.111-11'))).toEqual({
        invalidCpf: true,
      });
    });

    it('should return { invalidCpf: true } for CPFs with invalid verification digits', () => {
      expect(validator(new FormControl('123.456.789-11'))).toEqual({
        invalidCpf: true,
      });
    });

    it('should return null for a valid CPF', () => {
      const validCpfMasked = '529.982.247-25';
      expect(validator(new FormControl(validCpfMasked))).toBeNull();
    });
  });
});
