// src/app/core/transactions.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, serverTimestamp,
  query, where, orderBy, onSnapshot, Timestamp, getDocs, limit
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export type Tipo = 'entrada' | 'saida';
export type Meio = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'boleto' | 'outro';

export interface TransacaoDoc {
  id?: string;
  uid: string;
  date: Timestamp;          // data real
  monthKey: string;         // '2025-11' (para consulta rápida)
  tipo: Tipo;
  categoria: string;
  valor: number;
  meio: Meio;
  obs?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp | null; // soft delete (vai pra lixeira)
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private fs = inject(Firestore);
  private auth = inject(Auth);

  private colPath(uid: string) {
    return collection(this.fs, `users/${uid}/transactions`);
  }
  private monthKeyOf(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  /** Stream do mês (sem deletadas) */
  listenMonth(year: number, month: number, cb: (rows: TransacaoDoc[]) => void) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('not-authenticated');

    const key = `${year}-${String(month+1).padStart(2,'0')}`;
    const q = query(
      this.colPath(user.uid),
      where('monthKey','==', key),
      where('deletedAt','==', null),
      orderBy('date','desc')
    );
    const unsub = onSnapshot(q, snap => {
      const list: TransacaoDoc[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      cb(list);
    });
    return unsub;
  }

  async add(p: Omit<TransacaoDoc,'id'|'uid'|'createdAt'|'updatedAt'|'monthKey'|'deletedAt'>) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('not-authenticated');
    const d = p.date.toDate ? p.date.toDate() : (p.date as any as Date);
    const payload: TransacaoDoc = {
      ...p,
      uid: user.uid,
      monthKey: this.monthKeyOf(d),
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      deletedAt: null
    };
    await addDoc(this.colPath(user.uid), payload as any);
  }

  /** Soft-delete (vai pra lixeira) */
  async softDelete(id: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('not-authenticated');
    await updateDoc(doc(this.fs, `users/${user.uid}/transactions/${id}`), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /** Lista lixeira, mais recente primeiro */
  async listTrash(limitN = 50): Promise<TransacaoDoc[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('not-authenticated');
    const qy = query(
      this.colPath(user.uid),
      where('deletedAt','!=', null),
      orderBy('deletedAt','desc'),
      limit(limitN)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  /** Restaurar item da lixeira */
  async restore(id: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('not-authenticated');
    await updateDoc(doc(this.fs, `users/${user.uid}/transactions/${id}`), {
      deletedAt: null,
      updatedAt: serverTimestamp()
    });
  }

  async update(
    id: string,
    patch: Partial<Pick<TransacaoDoc, 'valor' | 'categoria' | 'meio' | 'obs'>>
  ) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('not-authenticated');

    const ref = doc(this.fs, `users/${user.uid}/transactions/${id}`);
    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp()
    } as any);
  }
}
