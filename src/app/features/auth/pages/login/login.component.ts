import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthErrorModalComponent } from '../../../../shared/components/ui/auth-error-modal/auth-error-modal.component';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AuthErrorModalComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // Estados reativos utilizando Signals
  protected isModalOpen = signal<boolean>(false);
  protected errorMessage = signal<string>('E-mail ou senha incorretos.');
  protected modalMessage = this.errorMessage;

  protected isLoading = signal<boolean>(false);
  protected showPassword = false;

  // Formulário de Login com validações customizadas
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, CustomValidators.emailValidator()]],
    senha: ['', [Validators.required, CustomValidators.passwordValidator()]],
  });

  // Alterna a visibilidade da senha
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Método auxiliar para checar se o campo está inválido e tocado
  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, senha } = this.loginForm.value;

    // Sanitização e formatação para o padrão esperado pelo backend
    const credentials = {
      email: email.trim().toLowerCase(),
      password: senha,
    };

    // Comunicação com o backend através do AuthService integrado
    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Redireciona para a rota anterior (returnUrl) ou para a home por padrão
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        this.isLoading.set(false);

        // REMovido o console.error genérico daqui.
        // Erros 401/404 são regras de negócio esperadas (credenciais inválidas) e não devem sujar o console.
        // Opcionalmente, mantemos o log apenas para falhas reais de servidor (ex: status 500).
        if (err.status !== 401 && err.status !== 404) {
          console.error('Erro crítico de infraestrutura:', err);
        }

        // Tratamento de mensagens de erro amigáveis baseadas no status HTTP
        if (err.status === 401 || err.status === 404) {
          this.errorMessage.set(
            'E-mail ou senha inválidos. Verifique os dados informados ou cadastre-se.',
          );
        } else {
          this.errorMessage.set(
            'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
          );
        }

        // Abre o modal flutuante de erro
        this.isModalOpen.set(true);
      },
    });
  }
}
