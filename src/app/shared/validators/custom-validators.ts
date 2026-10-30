import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validação Estrita de E-mail
   * Garante um formato de e-mail válido com domínio e TLD adequados.
   */
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();

      if (!value) {
        return null; // Deixa o Validator.required tratar campo vazio
      }

      // Regex estrito para validação de formato de e-mail
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailPattern.test(value);

      return isValid ? null : { invalidEmail: true };
    };
  }

  /**
   * Validação Forte de Senha (Segurança Avançada)
   * Requisitos:
   * - Mínimo de 8 caracteres
   * - Ao menos 1 letra maiúscula
   * - Ao menos 1 letra minúscula
   * - Ao menos 1 número
   * - Ao menos 1 caractere especial (!@#$%^&*...)
   */
  static passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(value);

      const passwordValid =
        hasMinLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumeric &&
        hasSpecialChar;

      if (passwordValid) {
        return null;
      }

      // Retorna os critérios não atendidos para dar feedback preciso na UI
      return {
        passwordStrength: {
          hasMinLength,
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar,
        },
      };
    };
  }

  /**
   * Validação Completa de CPF (Algoritmo do Dígito Verificador)
   * Valida comprimento, sequências repetidas e calcula os 2 dígitos verificadores oficiais.
   */
  static cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Remove caracteres não numéricos (pontos e hífen)
      const cpf = value.replace(/\D/g, '');

      // CPF deve possuir exatamente 11 dígitos
      if (cpf.length !== 11) {
        return { invalidCpf: true };
      }

      // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
      if (/^(\d)\1{10}$/.test(cpf)) {
        return { invalidCpf: true };
      }

      // Validação do 1º Dígito Verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i), 10) * (10 - i);
      }
      let rev = (sum * 10) % 11;
      if (rev === 10 || rev === 11) {
        rev = 0;
      }
      if (rev !== parseInt(cpf.charAt(9), 10)) {
        return { invalidCpf: true };
      }

      // Validação do 2º Dígito Verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i), 10) * (11 - i);
      }
      rev = (sum * 10) % 11;
      if (rev === 10 || rev === 11) {
        rev = 0;
      }
      if (rev !== parseInt(cpf.charAt(10), 10)) {
        return { invalidCpf: true };
      }

      return null; // CPF Válido
    };
  }
}
