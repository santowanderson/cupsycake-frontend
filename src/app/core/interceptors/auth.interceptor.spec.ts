import {
  HttpHandlerFn,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { describe, expect, it, jest } from '@jest/globals';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('should clone the outgoing request and set withCredentials to true', (done) => {
    // 1. Cria uma requisição HTTP de teste sem withCredentials habilitado inicialmente
    const originalReq = new HttpRequest('GET', '/api/products');
    expect(originalReq.withCredentials).toBe(false);

    // 2. Mock da função next (HttpHandlerFn) com cast explícito para evitar conflitos de tipagem
    const nextMock = jest
      .fn()
      .mockReturnValue(
        of(new HttpResponse({ status: 200, body: [] })),
      ) as unknown as HttpHandlerFn;

    // 3. Executa o interceptor passando a requisição e o handler mockado
    authInterceptor(originalReq, nextMock).subscribe({
      next: () => {
        // Valida se a função next foi chamada exatamente uma vez
        expect(nextMock).toHaveBeenCalledTimes(1);

        // Captura a requisição clonada que foi repassada para o próximo handler
        const interceptedReq = (nextMock as unknown as jest.Mock).mock
          .calls[0][0] as HttpRequest<any>;

        // Assegura que o parâmetro withCredentials foi ativado corretamente
        expect(interceptedReq.withCredentials).toBe(true);

        // Garante que a URL e o método original foram preservados
        expect(interceptedReq.url).toBe('/api/products');
        expect(interceptedReq.method).toBe('GET');

        done();
      },
      error: (err) => done(err),
    });
  });

  it('should preserve existing request headers and parameters while enabling withCredentials', (done) => {
    const customHeaders = new HttpHeaders({ 'X-Custom-Header': 'CustomValue' });
    const originalReq = new HttpRequest(
      'POST',
      '/api/orders',
      { amount: 100 },
      {
        headers: customHeaders,
      },
    );

    const nextMock = jest
      .fn()
      .mockReturnValue(
        of(new HttpResponse({ status: 201 })),
      ) as unknown as HttpHandlerFn;

    authInterceptor(originalReq, nextMock).subscribe({
      next: () => {
        const interceptedReq = (nextMock as unknown as jest.Mock).mock
          .calls[0][0] as HttpRequest<any>;

        expect(interceptedReq.withCredentials).toBe(true);
        expect(interceptedReq.headers.get('X-Custom-Header')).toBe(
          'CustomValue',
        );
        expect(interceptedReq.body).toEqual({ amount: 100 });

        done();
      },
      error: (err) => done(err),
    });
  });
});
