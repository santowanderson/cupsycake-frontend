import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]), // Necessário para o RouterOutlet
        provideHttpClient(), // Provê o HttpClient globalmente para os serviços filhos (como AuthService)
        provideHttpClientTesting(), // Provê o mock de testes para requisições HTTP
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app successfully', () => {
    expect(component).toBeTruthy();
  });

  it(`should have the 'cupsycake-frontend' title property`, () => {
    expect(component.title).toEqual('cupsycake-frontend');
  });

  it('should render root template elements without throwing errors', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
