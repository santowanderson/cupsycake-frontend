import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly isDropdownOpen = signal<boolean>(false);

  // Alterna a visibilidade do dropdown de perfil
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update((isOpen) => !isOpen);
  }

  // Fecha o dropdown explicitamente
  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  // Realiza o logout e fecha o menu
  logout(): void {
    this.closeDropdown();
    this.authService.logout().subscribe({
      error: (err) => console.error('Erro ao realizar logout:', err),
    });
  }

  // Fecha o menu dropdown caso o usuário clique em qualquer outro lugar da tela
  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeDropdown();
  }
}
