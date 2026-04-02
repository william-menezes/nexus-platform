import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { appRoutes } from './app.routes';

const NexusPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fff8f5',
      100: '#ffe8db',
      200: '#ffc9aa',
      300: '#ffa068',
      400: '#FF7B42',
      500: '#e05000',
      600: '#a63b00',
      700: '#7a2c00',
      800: '#4d1a00',
      900: '#2e1000',
      950: '#1a0800',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: NexusPreset,
        options: { darkModeSelector: '.dark' },
      },
      ripple: true,
    }),
    MessageService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
