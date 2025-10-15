// src/app/core/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

export const authGuard: CanActivateFn = async () => {
  const afAuth = inject(Auth);
  const router = inject(Router);

  // pega o usuário atual ou espera a primeira emissão do onAuthStateChanged
  const user = afAuth.currentUser ?? await new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(afAuth, (u) => { resolve(u); unsub(); });
  });

  if (!user) {
    router.navigateByUrl('/');
    return false;
  }
  return true;
};
