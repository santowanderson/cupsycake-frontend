import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Estados reativos com Signals para controle de UI
  protected isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showPassword = false;

  registerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    cpf: ['', [Validators.required, CustomValidators.cpfValidator()]],
    email: ['', [Validators.required, CustomValidators.emailValidator()]],
    telefone: [
      '',
      [
        Validators.required,
        // Valida rigorosamente o formato de telefone com 10 ou 11 dígitos: (xx) xxxx-xxxx ou (xx) xxxxx-xxxx
        Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
      ],
    ],
    gender: ['NOT_SPECIFIED', [Validators.required]],
    birth_date: ['', [Validators.required]],
    password: ['', [Validators.required, CustomValidators.passwordValidator()]],
    address: this.fb.group({
      zip_code: [
        '',
        [
          Validators.required,
          // Valida rigorosamente o formato do CEP: 00000-000
          Validators.pattern(/^\d{5}-\d{3}$/),
        ],
      ],
      street_address: ['', [Validators.required]],
      number: ['', [Validators.required]],
      complement: [''],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state_code: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(2)],
      ],
    }),
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string, groupName?: string): boolean {
    const control = groupName
      ? this.registerForm.get(`${groupName}.${fieldName}`)
      : this.registerForm.get(fieldName);

    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // --- MÉTODOS DE MÁSCARA ---

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    if (value.length > 10) {
      // Formato Celular: (xx) xxxxx-xxxx
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      // Formato Fixo / Parcial: (xx) xxxx-xxxx
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/^(\d*)/, '($1');
    }

    this.registerForm.get('telefone')?.setValue(value, { emitEvent: false });
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    value = value
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');

    this.registerForm.get('cpf')?.setValue(value, { emitEvent: false });
  }

  onZipCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);

    value = value.replace(/^(\d{5})(\d)/, '$1-$2');

    this.registerForm
      .get('address.zip_code')
      ?.setValue(value, { emitEvent: false });
  }

  // Mapeador auxiliar de estados do Brasil
  private getStateName(uf: string): string {
    const states: Record<string, string> = {
      SP: 'São Paulo',
      RJ: 'Rio de Janeiro',
      MG: 'Minas Gerais',
      ES: 'Espírito Santo',
      PR: 'Paraná',
      SC: 'Santa Catarina',
      RS: 'Rio Grande do Sul',
      BA: 'Bahia',
    };
    return states[uf.toUpperCase()] || uf.toUpperCase();
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const raw = this.registerForm.value;
    const cleanPhone = raw.telefone.replace(/\D/g, '');
    const areaCode = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);
    const stateCode = raw.address.state_code.toUpperCase();

    const registerPayload = {
      first_name: raw.first_name.trim(),
      last_name: raw.last_name.trim(),
      cpf: raw.cpf.replace(/\D/g, ''),
      email: raw.email.trim().toLowerCase(),
      area_code: areaCode,
      phone_number: phoneNumber,
      gender: raw.gender,
      birth_date: raw.birth_date,
      password: raw.password,
      address: {
        zip_code: raw.address.zip_code.replace(/\D/g, ''),
        street_address: raw.address.street_address.trim(),
        number: raw.address.number.trim(),
        complement: raw.address.complement
          ? raw.address.complement.trim()
          : null,
        neighborhood: raw.address.neighborhood.trim(),
        city: raw.address.city.trim(),
        state_code: stateCode,
        state_name: this.getStateName(stateCode),
      },
    };

    this.authService.register(registerPayload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' },
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Falha ao registrar usuário:', err);

        if (err.status === 400 || err.status === 409) {
          this.errorMessage.set(
            err.error?.error ||
              'Este e-mail ou CPF já está cadastrado no sistema.',
          );
        } else {
          this.errorMessage.set(
            'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
          );
        }
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
