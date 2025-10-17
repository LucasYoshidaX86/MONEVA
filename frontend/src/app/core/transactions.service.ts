// src/app/core/transactions.service.ts
import { Injectable, inject } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, orderBy, Timestamp, serverTimestamp
} from '@angular/fire/firestore';

export type TxType = 'receita' | 'despesa';
export type TxMethod = 'dinheiro' | 'cartao' | 'pix' | 'boleto' | 'transferencia' | 'outro';

export interface Transaction {
  id?: string;
  type: TxType;
  method: TxMethod;
  category: string;
  amount: number;
  date: any;        // Firestore Timestamp
  note?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface TxFilters {
  start?: Date | null;
  end?: Date | null;
  type?: 'todos' | TxType;
  method?: 'todos' | TxMethod;
  category?: string;
  min?: number | null;
  max?: number | null;
  text?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  /** UID atual (promessa) */
  private async getUid(): Promise<string> {
    const user = this.auth.currentUser ?? await new Promise<User | null>(res => {
      const unsub = onAuthStateChanged(this.auth, u => { res(u); unsub(); });
    });
    if (!user) throw new Error('not-authenticated');
    return user.uid;
  }

  private async colRef() {
    const uid = await this.getUid();
    return collection(this.db, `users/${uid}/transactions`);
  }

  /** Cria transação */
  async create(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const col = await this.colRef();
    return addDoc(col, {
      ...tx,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /** Atualiza transação */
  async update(id: string, patch: Partial<Transaction>) {
    const uid = await this.getUid();
    const ref = doc(this.db, `users/${uid}/transactions/${id}`);
    return updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  }

  /** Remove transação */
  async remove(id: string) {
    const uid = await this.getUid();
    const ref = doc(this.db, `users/${uid}/transactions/${id}`);
    return deleteDoc(ref);
  }

  /** Lista por filtros (consulta eficiente no Firestore) */
  async list(filters: TxFilters): Promise<Transaction[]> {
    const col = await this.colRef();

    // Base query sempre ordenada por data
    let q = query(col, orderBy('date', 'desc'));

    // Aplicações de filtros possíveis no Firestore
    const clauses: any[] = [];

    if (filters.type && filters.type !== 'todos') {
      clauses.push(where('type', '==', filters.type));
    }
    if (filters.method && filters.method !== 'todos') {
      clauses.push(where('method', '==', filters.method));
    }
    if (filters.min != null) {
      clauses.push(where('amount', '>=', filters.min));
    }
    if (filters.max != null) {
      clauses.push(where('amount', '<=', filters.max));
    }
    if (filters.start) {
      clauses.push(where('date', '>=', Timestamp.fromDate(filters.start)));
    }
    if (filters.end) {
      // acrescenta fim do dia
      const endDate = new Date(filters.end);
      endDate.setHours(23, 59, 59, 999);
      clauses.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }

    // Monta a query final
    if (clauses.length) {
      q = query(col, orderBy('date', 'desc'), ...clauses);
    }

    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));

    // Filtro em memória (não indexável): categoria / texto (note, category)
    if (filters.category && filters.category.trim()) {
      const term = filters.category.toLowerCase();
      list = list.filter(t => t.category?.toLowerCase().includes(term));
    }
    if (filters.text && filters.text.trim()) {
      const term = filters.text.toLowerCase();
      list = list.filter(t =>
        (t.note && t.note.toLowerCase().includes(term)) ||
        (t.category && t.category.toLowerCase().includes(term))
      );
    }

    return list;
  }

  /** Resumo */
  summarize(list: Transaction[]) {
    const income = list.filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const expense = list.filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }

  /** Utilitário para exportar CSV do resultado filtrado */
  exportCsv(list: Transaction[]) {
    const header = ['Data', 'Tipo', 'Método', 'Categoria', 'Valor', 'Obs.'];
    const rows = list.map(t => [
      t.date?.toDate ? t.date.toDate().toLocaleDateString('pt-BR') : '',
      t.type, t.method, t.category, (t.amount ?? 0).toString().replace('.', ','),
      t.note ?? ''
    ]);
    const csv = [header, ...rows].map(r => r.map(x => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `demonstrativos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
