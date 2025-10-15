import { Injectable, inject } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserProfile {
  completedOnboarding: boolean;
  gender?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer';
  monthlyIncome?: number;
  lifeGoals?: string;          // objetivos de vida
  financialGoals?: string;     // objetivos financeiros
  dreams?: string;             // sonhos
  pains?: string;              // dores
  currentStatus?: 'devendo' | 'sem_economia' | 'equilibrado' | 'investindo';
  createdAt?: any;
  updatedAt?: any;
  displayName?: string;        // opcional (espelho do Firebase Auth)
  email?: string;              // opcional
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  /** UID atual (promessa) */
  async getUid(): Promise<string> {
    const user = this.auth.currentUser ?? await new Promise<User | null>(res => {
      const unsub = onAuthStateChanged(this.auth, u => { res(u); unsub(); });
    });
    if (!user) throw new Error('not-authenticated');
    return user.uid;
    }

  /** Caminho do doc do usuário */
  private userDocRef(uid: string) {
    return doc(this.db, `users/${uid}`);
  }

  /** Lê o perfil (uma vez) */
  async getProfile(): Promise<UserProfile | null> {
    const uid = await this.getUid();
    const snap = await getDoc(this.userDocRef(uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  /** Observa mudanças no perfil em tempo real */
  profile$(): Observable<UserProfile | null> {
    return new Observable(observer => {
      const unsubAuth = onAuthStateChanged(this.auth, user => {
        if (!user) { observer.next(null); return; }
        const unsub = onSnapshot(this.userDocRef(user.uid), s => {
          observer.next(s.exists() ? (s.data() as UserProfile) : null);
        }, err => observer.error(err));
        // cleanup quando trocar de user
        return () => unsub();
      });
      return () => unsubAuth();
    });
  }

  /** Salva/atualiza perfil */
  async upsertProfile(patch: Partial<UserProfile>) {
    const uid = await this.getUid();
    const ref = this.userDocRef(uid);
    const base: Partial<UserProfile> = {
      email: this.auth.currentUser?.email ?? undefined,
      displayName: this.auth.currentUser?.displayName ?? undefined,
    };
    await setDoc(ref, {
      ...base,
      ...patch,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
  }

  /** Marca onboarding como concluído */
  async markOnboardingCompleted() {
    await this.upsertProfile({ completedOnboarding: true });
  }
}
