import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, serverTimestamp, Timestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface GoalDoc {
  id?: string;
  uid: string;
  monthKey: string;   // 'YYYY-MM'
  valorMeta: number;  // valor a economizar no mês
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

@Injectable({ providedIn:'root' })
export class GoalsService {
  private fs = inject(Firestore);
  private auth = inject(Auth);

  private keyOf(year:number, month:number){
    return `${year}-${String(month+1).padStart(2,'0')}`;
  }

  /** Lê (ou cria com default) a meta do mês */
  async getMonthGoal(year:number, month:number): Promise<GoalDoc> {
    const u = this.auth.currentUser;
    if (!u) throw new Error('not-authenticated');
    const key = this.keyOf(year, month);
    const ref = doc(this.fs, `users/${u.uid}/goals/${key}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as GoalDoc;
    }
    const payload: GoalDoc = {
      uid: u.uid,
      monthKey: key,
      valorMeta: 1000, // default inicial, ajuste como quiser
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    await setDoc(ref, payload as any);
    return payload;
  }

  async setMonthGoal(year:number, month:number, valor:number){
    const u = this.auth.currentUser;
    if (!u) throw new Error('not-authenticated');
    const key = this.keyOf(year, month);
    const ref = doc(this.fs, `users/${u.uid}/goals/${key}`);
    await setDoc(ref, {
      uid: u.uid,
      monthKey: key,
      valorMeta: valor,
      updatedAt: serverTimestamp()
    }, { merge:true });
  }
}
