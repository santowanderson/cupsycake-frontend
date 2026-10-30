import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/user.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  let apiUrl = environment.apiUrl;

  const mockUserProfile: UserProfile = {
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
    complement: 'Apto 101',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state_code: 'SP',
    state_name: 'São Paulo',
  };

  beforeEach(() => {
    // Garante que o localStorage comece limpo para evitar chamadas automáticas indesejadas no construtor
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created successfully with default unauthenticated state', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  // ==========================================
  // 1. TESTES DE LOGIN E CARREGAMENTO DE PERFIL (login / loadProfile)
  // ==========================================
  describe('Login & Profile Loading', () => {
    it('should perform login POST request with credentials and update user profile from response payload', () => {
      const credentials = {
        email: 'wanderson@test.com',
        password: 'Password@123',
      };
      let loginResult: any;

      service.login(credentials).subscribe((res) => {
        loginResult = res;
      });

      // 1. Intercepta a requisição de login POST
      const loginReq = httpMock.expectOne(`${apiUrl}/api/auth/login`);
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual(credentials);
      expect(loginReq.request.withCredentials).toBe(true);

      // Responde com o sucesso do login contendo o objeto user embutido
      loginReq.flush({
        success: true,
        message: 'Login realizado com sucesso!',
        user: mockUserProfile,
      });

      expect(loginResult.success).toBe(true);
      expect(service.currentUser()).toEqual(mockUserProfile);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('has_active_session')).toBe('true');
    });

    it('should load profile successfully and set currentUser and isAuthenticated signals', () => {
      let result: UserProfile | null | undefined;

      service.loadProfile().subscribe((profile) => {
        result = profile;
      });

      const req = httpMock.expectOne(`${apiUrl}/api/auth/profile`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUserProfile);

      expect(result).toEqual(mockUserProfile);
      expect(service.currentUser()).toEqual(mockUserProfile);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle 401 Unauthorized gracefully and set currentUser to null when loading profile fails', () => {
      let result: UserProfile | null | undefined;
      localStorage.setItem('has_active_session', 'true');

      service.loadProfile().subscribe((profile) => {
        result = profile;
      });

      const req = httpMock.expectOne(`${apiUrl}/api/auth/profile`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      // Simula erro 401 retornado pelo servidor
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(result).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('has_active_session')).toBeNull();
    });
  });

  // ==========================================
  // 2. TESTES DE REGISTRO (register)
  // ==========================================
  describe('Register', () => {
    it('should send POST request to register endpoint with user data', () => {
      const userData = { first_name: 'Wanderson', email: 'wanderson@test.com' };
      let response: any;

      service.register(userData).subscribe((res) => {
        response = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/api/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush({ success: true });

      expect(response).toEqual({ success: true });
    });
  });

  // ==========================================
  // 3. TESTES DE LOGOUT E REDIRECIONAMENTO (logout)
  // ==========================================
  describe('Logout & Navigation', () => {
    beforeEach(() => {
      service.currentUser.set(mockUserProfile);
      localStorage.setItem('has_active_session', 'true');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should clear currentUser and navigate to home ("/") if currentUrl includes /cart', () => {
      Object.defineProperty(router, 'url', {
        get: () => '/cart/checkout',
        configurable: true,
      });
      let response: any;

      service.logout().subscribe((res) => {
        response = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/api/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true });

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('has_active_session')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(response).toEqual({ success: true });
    });

    it('should clear currentUser and navigate to home ("/") if currentUrl includes /orders', () => {
      Object.defineProperty(router, 'url', {
        get: () => '/orders',
        configurable: true,
      });

      service.logout().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/api/auth/logout`);
      req.flush({});

      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('has_active_session')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should clear currentUser and navigate to /auth/login for other standard routes', () => {
      Object.defineProperty(router, 'url', {
        get: () => '/profile',
        configurable: true,
      });

      service.logout().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/api/auth/logout`);
      req.flush({});

      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('has_active_session')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ==========================================
  // 4. TESTES DE VALIDAÇÃO DE ROTA PROTEGIDA (validateAuthAndRedirect)
  // ==========================================
  describe('validateAuthAndRedirect', () => {
    it('should return true if user is authenticated', () => {
      service.currentUser.set(mockUserProfile);
      expect(service.isAuthenticated()).toBe(true);

      const isValid = service.validateAuthAndRedirect('/cart');
      expect(isValid).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should return false and navigate to login with returnUrl queryParam if user is unauthenticated', () => {
      expect(service.isAuthenticated()).toBe(false);

      const isValid = service.validateAuthAndRedirect('/orders');
      expect(isValid).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/orders' },
      });
    });

    it('should use default returnUrl (/cart) if none is provided when unauthenticated', () => {
      const isValid = service.validateAuthAndRedirect();
      expect(isValid).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/cart' },
      });
    });
  });
});
