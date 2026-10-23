import { provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { arrancar } from './app/nucleo/arranque';

bootstrapApplication(AppComponent, {
  providers: [
    // Sin precarga global: los chunks se cargan bajo demanda (assets locales),
    // así el arranque no gasta CPU/RAM precargando pantallas que no se usan.
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => arrancar()),
  ],
});

