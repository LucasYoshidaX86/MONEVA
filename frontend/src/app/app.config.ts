import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authHttpInterceptor } from './core/auth.interceptor';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { firebaseConfig } from '../environments/firebase.config';

// Forms
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // Se não quiser o interceptor agora, troque por: provideHttpClient()
    provideHttpClient(withInterceptors([authHttpInterceptor])),

    // Módulos clássicos via importProvidersFrom
    importProvidersFrom(FormsModule, ReactiveFormsModule),

    // ⚠️ Estes ficam FORA do importProvidersFrom
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
};
