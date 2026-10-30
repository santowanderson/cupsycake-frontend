import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-error-modal.component.html',
  styleUrl: './auth-error-modal.component.css',
})
export class AuthErrorModalComponent {
  isOpen = input.required<boolean>();
  errorMessage = input<string>('E-mail ou senha incorretos.');

  closed = output<void>();

  constructor(private router: Router) {}

  onClose(): void {
    this.closed.emit();
  }

  // Fecha o modal caso o clique seja no fundo fosco (backdrop)
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  goToRegister(): void {
    this.onClose();
    this.router.navigate(['/auth/register']);
  }
}
