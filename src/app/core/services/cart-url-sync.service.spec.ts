import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Subject } from 'rxjs';
import { ProductService } from '../../features/products/services/product.service';
import { CartUrlSyncService } from './cart-url-sync.service';
import { CartItem, CartService } from './cart.service';

describe('CartUrlSyncService', () => {
  let service: CartUrlSyncService;
  let cartServiceMock: any;
  let productServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;
  let routerEventsSubject: Subject<any>;

  const mockProduct = {
    id: 1,
    name: 'Cupcake de Chocolate',
    price: 10.0,
    stock_quantity: 10,
  };

  const mockProduct2 = {
    id: 2,
    name: 'Cupcake de Morango',
    price: 12.0,
    stock_quantity: 5,
  };

  beforeEach(() => {
    routerEventsSubject = new Subject<any>();

    cartServiceMock = {
      items: signal<CartItem[]>([]),
      addToCart: jest.fn((product, qty) => {
        const current = cartServiceMock.items();
        cartServiceMock.items.set([...current, { product, quantity: qty }]);
      }),
    };

    productServiceMock = {
      products: signal([mockProduct, mockProduct2]),
    };

    routerMock = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      events: routerEventsSubject.asObservable(),
    };

    activatedRouteMock = {
      snapshot: {
        queryParams: {},
      },
    };

    TestBed.configureTestingModule({
      providers: [
        CartUrlSyncService,
        { provide: CartService, useValue: cartServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    });

    service = TestBed.inject(CartUrlSyncService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should populate cart from queryParams using product names as slugs on init', () => {
    activatedRouteMock.snapshot.queryParams = { 'cupcake-de-chocolate': '2' };

    service.init();

    expect(cartServiceMock.addToCart).toHaveBeenCalledWith(mockProduct, 2);
  });

  it('should ignore invalid quantities or unknown products in queryParams', () => {
    activatedRouteMock.snapshot.queryParams = {
      'cupcake-invalido': '3',
      'cupcake-de-chocolate': 'abc',
    };

    service.init();

    expect(cartServiceMock.addToCart).not.toHaveBeenCalled();
  });

  it('should update queryParams when items are added to the cart', async () => {
    service.init();

    cartServiceMock.items.set([{ product: mockProduct, quantity: 3 }]);

    await Promise.resolve();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { 'cupcake-de-chocolate': '3' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('should remove queryParams (set to null) when an item is removed from the cart', async () => {
    activatedRouteMock.snapshot.queryParams = { 'cupcake-de-chocolate': '2' };
    service.init();

    cartServiceMock.items.set([]);

    await Promise.resolve();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          'cupcake-de-chocolate': null,
        }),
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('should synchronize cart queryParams on NavigationEnd event', () => {
    service.init();
    cartServiceMock.items.set([{ product: mockProduct2, quantity: 1 }]);

    routerEventsSubject.next(
      new NavigationEnd(1, '/other-route', '/other-route'),
    );

    expect(routerMock.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          'cupcake-de-morango': '1',
        }),
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });
});
