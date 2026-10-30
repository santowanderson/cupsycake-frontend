import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let authServiceMock: { isAuthenticated: jest.Mock };
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/auth/login' } as RouterStateSnapshot;

  beforeEach(async () => {
    authServiceMock = {
      isAuthenticated: jest.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));
  });

  it('should allow route activation when user is unauthenticated (guest)', () => {
    // Simula que o usuário NÃO está autenticado (isAuthenticated retorna false)
    authServiceMock.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(authServiceMock.isAuthenticated).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should block route activation and redirect to home when user is already authenticated', () => {
    // Simula que o usuário JÁ está autenticado (isAuthenticated retorna true)
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(mockRoute, mockState),
    );

    expect(result).toBe(false);
    expect(authServiceMock.isAuthenticated).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
