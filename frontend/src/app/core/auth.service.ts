import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  constructor() {
    setPersistence(this.auth, browserLocalPersistence);
  }

  /** Observa usuário logado (se precisar em outras telas) */
  onUserChanged(cb: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, cb);
  }

  /** Cadastro → retorna o User */
  async register(data: { name: string; email: string; password: string }): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
    await updateProfile(cred.user, { displayName: data.name });
    return cred.user;
  }

  /** Login → retorna o User */
  async login(email: string, password: string): Promise<User> {
    const res = await signInWithEmailAndPassword(this.auth, email, password);
    return res.user;
  }

  /** Envia e-mail de recuperação */
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  logout() {
    return this.auth.signOut();
  }

  /** Emite o usuário logado (ou null) sempre que o estado mudar */
authState$(): Observable<User | null> {
  return new Observable<User | null>((observer) => {
    const unsubscribe = onAuthStateChanged(
      this.auth,
      (user) => observer.next(user),
      (err)  => observer.error(err)
    );
    // cleanup da inscrição
    return unsubscribe;
  });
}

/** Emite true/false conforme usuário logado (usado pelo guard) */
isLoggedIn$(): Observable<boolean> {
  return new Observable<boolean>((observer) => {
    const unsubscribe = onAuthStateChanged(
      this.auth,
      (user) => observer.next(!!user),
      (err)  => observer.error(err)
    );
    return unsubscribe;
  });
}

}


