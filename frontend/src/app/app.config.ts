// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

// Firestore (com persistência opcional)
import {
  provideFirestore,
  getFirestore,
  enableIndexedDbPersistence // ou initializeFirestore + persistentLocalCache
} from '@angular/fire/firestore';

import { firebaseConfig } from '../environments/firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),

    // 🔴 Firestore precisa ser provido
    provideFirestore(() => {
      const fs = getFirestore();
      // Persistência offline (opcional, mas ajuda muito)
      enableIndexedDbPersistence(fs).catch(() => {
        // Se abrir mais de uma aba, a persistência pode falhar -> ignore no dev
        console.warn('Firestore persistence not enabled (multi-tab?)');
      });
      return fs;
    }),
  ],
};
