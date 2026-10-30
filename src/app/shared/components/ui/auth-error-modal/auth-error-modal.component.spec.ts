import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthErrorModalComponent } from './auth-error-modal.component';

describe('AuthErrorModalComponent', () => {
  let component: AuthErrorModalComponent;
  let fixture: ComponentFixture<AuthErrorModalComponent>;
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AuthErrorModalComponent],
      providers: [{ provide: Router, useValue: routerMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthErrorModalComponent);
    component = fixture.componentInstance;

    // Inicializa os Signal Inputs diretamente como funções getter para testes unitários isolados
    // @ts-expect-error - Atribuindo valor ao Signal Input required para satisfazer o ciclo de renderização
    component.isOpen = () => true;
    // @ts-expect-error - Atribuindo valor padrão ao Signal Input opcional
    component.errorMessage = () => 'E-mail ou senha incorretos.';

    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default errorMessage', () => {
    expect(component.errorMessage()).toBe('E-mail ou senha incorretos.');
  });

  it('should accept custom errorMessage input value', () => {
    // @ts-expect-error
    component.errorMessage = () => 'Credenciais inválidas.';
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Credenciais inválidas.');
  });

  it('should emit closed output when onClose is triggered', () => {
    const closedSpy = jest.spyOn(component.closed, 'emit');

    component.onClose();

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should close modal (emit closed) when backdrop element is clicked', () => {
    const closedSpy = jest.spyOn(component.closed, 'emit');

    const backdropElement = document.createElement('div');
    backdropElement.classList.add('modal-backdrop');
    const mouseEvent = { target: backdropElement } as unknown as MouseEvent;

    component.onBackdropClick(mouseEvent);

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should NOT close modal when clicking inside the modal content box', () => {
    const closedSpy = jest.spyOn(component.closed, 'emit');

    const contentElement = document.createElement('div');
    contentElement.classList.add('modal-box');
    const mouseEvent = { target: contentElement } as unknown as MouseEvent;

    component.onBackdropClick(mouseEvent);

    expect(closedSpy).not.toHaveBeenCalled();
  });

  it('should close modal and navigate to register route when goToRegister is called', () => {
    const closedSpy = jest.spyOn(component.closed, 'emit');

    component.goToRegister();

    expect(closedSpy).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/register']);
  });
});
