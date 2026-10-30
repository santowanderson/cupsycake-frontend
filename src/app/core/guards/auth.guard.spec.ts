import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceMock: { currentUser: jest.Mock };
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/cart' } as RouterStateSnapshot;

  const mockUserProfile = {
    customer_id: 1,
    first_name: 'Wanderson',
    last_name: 'Pereira',
    email: 'wanderson@test.com',
    cpf: '12345678909',
    formatted_phone: '(11) 98765-4321',
    gender: 'MALE',
    birth_date: '2000-01-01',
    age: 26,
    zip_code: '06500000',
    street_address: 'Rua Principal',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state_code: 'SP',
    state_name: 'São Paulo',
  };

  beforeEach(async () => {
    authServiceMock = {
      currentUser: jest.fn(),
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

  it('should allow route activation when user is authenticated', () => {
    authServiceMock.currentUser.mockReturnValue(mockUserProfile);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(authServiceMock.currentUser).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should block route activation and trigger redirect to login when user is unauthenticated', () => {
    authServiceMock.currentUser.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState),
    );

    expect(result).toBe(false);
    expect(authServiceMock.currentUser).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
