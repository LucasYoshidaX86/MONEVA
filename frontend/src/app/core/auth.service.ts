import { Injectable, inject } from '@angular/core';
import {
  Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile, setPersistence,
  browserLocalPersistence, onAuthStateChanged, User
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserProfileService } from './user-profile.service'; // <-- importe

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private profileSvc = inject(UserProfileService); // <-- injete

  constructor() {
    setPersistence(this.auth, browserLocalPersistence);
  }

  onUserChanged(cb: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, cb);
  }

  async register(data: { name: string; email: string; password: string }): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
    await updateProfile(cred.user, { displayName: data.name });

    // (opcional recomendado) grava/atualiza no Firestore também:
    await this.profileSvc.upsertProfile({ displayName: data.name });

    return cred.user;
  }

  async login(email: string, password: string): Promise<User> {
    const res = await signInWithEmailAndPassword(this.auth, email, password);
    return res.user;
  }

  resetPassword(email: string) { return sendPasswordResetEmail(this.auth, email); }
  logout() { return this.auth.signOut(); }

  authState$(): Observable<User | null> {
    return new Observable<User | null>((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => observer.next(user), (err) => observer.error(err));
      return unsubscribe;
    });
  }

  isLoggedIn$(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => observer.next(!!user), (err) => observer.error(err));
      return unsubscribe;
    });
  }
}
