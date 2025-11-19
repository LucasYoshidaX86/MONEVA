// src/app/core/trilha.service.ts
import { Injectable, signal, WritableSignal } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

export type NodeStatus = 'locked' | 'unlocked' | 'completed';
export type NodeKind   = 'lesson' | 'game';

export interface TrilhaNode     { id: string; kind: NodeKind; title: string; emoji: string; }
export interface TrilhaSection  { id: string; title: string; nodes: TrilhaNode[]; }

// ===== CONFIG GERAL =====
const PASS_THRESHOLD = 60;          // % mínima pra passar de fase
const XP_PER_KIND: Record<NodeKind, number> = {
  lesson: 50,
  game: 80
};

const ACHIEVEMENT_XP_MARKS = [100, 300, 600, 1000, 1500, 2100];

// ===== CATÁLOGO DA TRILHA =====
const SECTIONS: TrilhaSection[] = [
  {
    id: 'sec1', title: 'Introdução à Gestão Financeira 💰',
    nodes: [
      { id:'sec1-n1', kind:'lesson', title:'Por que cuidar do seu dinheiro é <strong>importante</strong>?', emoji:'🧠' },
      { id:'sec1-n2', kind:'game',   title:'Quiz: "Você sabe lidar com dinheiro?"',   emoji:'🎯' },
      { id:'sec1-n3', kind:'lesson', title:'Como a educação financeira muda sua vida',  emoji:'💡' },
      { id:'sec1-n4', kind:'game',   title:'Desafio dos Erros Financeiros', emoji:'⚖️' },
      { id:'sec1-n5', kind:'lesson', title:'Passos simples para começar hoje!',  emoji:'👣' },
    ]
  },
  {
    id: 'sec2', title: 'Orçamento 📒',
    nodes: [
      { id:'sec2-n1', kind:'lesson', title:'O que é orçamento e como ele te ajuda!', emoji:'💰' },
      { id:'sec2-n2', kind:'game',   title:'Monte seu orçamento ideal', emoji:'🧩' },
      { id:'sec2-n3', kind:'lesson', title:'Como dividir seu dinheiro com sabedoria', emoji:'🧾' },
      { id:'sec2-n4', kind:'game',   title:'Desafio do fim do mês', emoji:'⏳' },
      { id:'sec2-n5', kind:'lesson', title:'Ferramentas simples para planejar seu mês', emoji:'🛠️' },
    ]
  },
  {
    id: 'sec3', title: 'Controle de Gastos 📊',
    nodes: [
      { id:'sec3-n1', kind:'lesson', title:'Por onde o dinheiro escapa', emoji:'🕳️' },
      { id:'sec3-n2', kind:'game',   title:'Caça aos vilões do orçamento', emoji:'🕵️‍♂️' },
      { id:'sec3-n3', kind:'lesson', title:'A importância de anotar tudo', emoji:'✍️' },
      { id:'sec3-n4', kind:'game',   title:'Jogo do corte inteligente', emoji:'✂️' },
      { id:'sec3-n5', kind:'lesson', title:'Dicas para economizar sem sofrer', emoji:'🌱' },
    ]
  },
];

// Rotas usadas no template
const ROUTE_MAP: Record<string, string> = {
  'sec1-n1': '/trilha/Introducao',
  'sec1-n2': '/trilha/quiz-dinheiro',
  'sec1-n3': '/trilha/educacao-financeira',
  'sec1-n4': '/trilha/reserva', 
  'sec1-n5': '/trilha/passos-simples',

  'sec2-n1': '/trilha/orcamento',
  'sec2-n2': '/trilha/monte-orcamento',
  'sec2-n3': '/trilha/orcamento-dicas',
  'sec2-n4': '/trilha/desafio-fim-mes',
  'sec2-n5': '/trilha/ferramentas-planejamento',

  'sec3-n1': '/trilha',
  'sec3-n2': '/trilha',
  'sec3-n3': '/trilha',
  'sec3-n4': '/trilha',
  'sec3-n5': '/trilha',
};

// ===== ESTADO =====
type StatusMap = Record<string, NodeStatus>;
type ScoreMap  = Record<string, number>; // melhor % por nó
type XpMap     = Record<string, number>; // XP ganho em cada nó

interface ProgressState {
  statusMap: StatusMap;
  bestScoreByNode: ScoreMap;
  xpByNode: XpMap;
  totalXp: number;
}

// Documento MINIMAL salvo no Firestore
interface RemoteProgressDoc {
  currentNodeId: string | null;
  totalXp: number;
}

@Injectable({ providedIn: 'root' })
export class TrilhaProgressService {

  private _state: WritableSignal<ProgressState> = signal(this.emptyState());
  state = this._state.asReadonly();

  private user: User | null = null;

  get sections(): TrilhaSection[] { return SECTIONS; }

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    // estado inicial local
    this._state.set(this.emptyState());
    this.bootstrapUnlocks();

    // tenta pegar o usuário já logado (por exemplo, após F5)
    this.user = this.auth.currentUser ?? null;
    if (this.user) {
      console.log('[Trilha] usuário inicial', this.user.uid);
      this.loadFromCloud();
    }

    // mantém sincronizado com o Firebase Auth
    onAuthStateChanged(this.auth, (u) => {
      this.user = u ?? null;
      console.log('[Trilha] onAuthStateChanged', this.user?.uid);

      if (this.user) {
        this.loadFromCloud();
      } else {
        this._state.set(this.emptyState());
        this.bootstrapUnlocks();
      }
    });
  }

  // ======= Helpers de estado =======
  private emptyState(): ProgressState {
    return {
      statusMap: {},
      bestScoreByNode: {},
      xpByNode: {},
      totalXp: 0
    };
  }

  private userDocRef() {
    if (!this.user) return null;
    return doc(this.firestore, 'users', this.user.uid, 'trilha', 'status');
  }

  /**
   * Versão MINIMAL que vai pro Firestore:
   * - currentNodeId: último nó concluído (ou null se nenhum)
   * - totalXp: XP total
   */
  private serialize(state: ProgressState): RemoteProgressDoc {
    const last = this.getLastCompletedNodeId(state.statusMap);
    return {
      currentNodeId: last ?? null,
      totalXp: state.totalXp
    };
  }

  /** Encontra o último nó marcado como "completed" na ordem da trilha */
  private getLastCompletedNodeId(map: StatusMap): string | null {
    let last: string | null = null;
    for (const sec of SECTIONS) {
      for (const node of sec.nodes) {
        if (map[node.id] === 'completed') {
          last = node.id;
        }
      }
    }
    return last;
  }

  /** Reconstrói ProgressState a partir do doc MINIMAL do Firestore */
  private rebuildStateFromMinimal(currentNodeId: string | null, totalXp: number): ProgressState {
    const st = this.emptyState();
    st.totalXp = totalXp;

    const map: StatusMap = {};

    if (currentNodeId) {
      let stop = false;
      for (const sec of SECTIONS) {
        for (const node of sec.nodes) {
          map[node.id] = 'completed';
          if (node.id === currentNodeId) {
            stop = true;
            break;
          }
        }
        if (stop) break;
      }
    }

    st.statusMap = this.applyGates(map);
    return st;
  }

  private async loadFromCloud() {
    const ref = this.userDocRef();
    if (!ref) {
      console.warn('[Trilha] loadFromCloud: sem userRef');
      this._state.set(this.emptyState());
      this.bootstrapUnlocks();
      return;
    }

    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.log('[Trilha] Nenhum progresso remoto, começando do zero');
        const st = this.emptyState();
        this._state.set(st);
        this.bootstrapUnlocks();
        return;
      }

      const data = snap.data() as any;
      let st: ProgressState;

      // Compatível com formato antigo (statusMap, xpByNode, etc.)
      if (data.statusMap || data.map) {
        console.log('[Trilha] carregando formato antigo de progresso');
        st = {
          statusMap: data.statusMap ?? data.map ?? {},
          bestScoreByNode: data.bestScoreByNode ?? {},
          xpByNode: data.xpByNode ?? {},
          totalXp: typeof data.totalXp === 'number' ? data.totalXp : 0
        };
      } else {
        // Formato novo minimalista
        console.log('[Trilha] carregando formato minimalista de progresso');
        const totalXp = typeof data.totalXp === 'number' ? data.totalXp : 0;
        const currentNodeId = (data.currentNodeId ?? null) as string | null;
        st = this.rebuildStateFromMinimal(currentNodeId, totalXp);
      }

      this._state.set(st);
      this.bootstrapUnlocks();
    } catch (e) {
      console.error('[Trilha] Erro ao carregar progresso do Firestore', e);
      this._state.set(this.emptyState());
      this.bootstrapUnlocks();
    }
  }

  private async saveToCloud() {
    const ref = this.userDocRef();
    if (!ref) {
      console.warn('[Trilha] saveToCloud: usuário não definido, não salvando');
      return;
    }
    const payload = this.serialize(this._state());
    try {
      console.log('[Trilha] salvando progresso na nuvem', payload);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.error('[Trilha] erro ao salvar progresso no Firestore', e);
    }
  }

  // ======= API usada pelo componente da trilha =======

  getStatus(id: string): NodeStatus {
    return this._state().statusMap[id] ?? 'locked';
  }

  /** Progresso do nó: usa melhor % salva (0–100) */
  nodeProgress(id: string): number {
    const best = this._state().bestScoreByNode[id];
    if (typeof best === 'number') {
      return Math.max(0, Math.min(100, Math.round(best)));
    }
    return this.getStatus(id) === 'completed' ? 100 : 0;
  }

  bestScore(id: string): number {
    return this._state().bestScoreByNode[id] ?? 0;
  }

  nodeXp(id: string): number {
    return this._state().xpByNode[id] ?? 0;
  }

  totalXp(): number {
    return this._state().totalXp;
  }

  level(): number {
    return Math.floor(Math.sqrt(this.totalXp()));
  }

  xpToNextLevel(): number {
    const lvl = this.level();
    const next = Math.pow(lvl + 1, 2);
    return Math.max(0, next - this.totalXp());
  }

  progressToNextLevel(): number {
    const lvl = this.level();
    const curCap = Math.pow(lvl, 2);
    const nextCap = Math.pow(lvl + 1, 2);
    const cur = this.totalXp() - curCap;
    const span = nextCap - curCap || 1;
    return Math.round((cur / span) * 100);
  }

  isAchievementUnlocked(mark: number): boolean {
    return this.totalXp() >= mark;
  }

  unlockedAchievements(): number[] {
    return ACHIEVEMENT_XP_MARKS.filter(m => this.totalXp() >= m);
  }

  // ===== SUBMISSÃO DE SCORE (quizzes) =====
  submitScore(nodeId: string, correct: number, total: number) {
    const st = { ...this._state() };

    const node = this.findNode(nodeId);
    if (!node) throw new Error(`Nó desconhecido: ${nodeId}`);

    const score = Math.max(0, Math.min(100, Math.round((correct / Math.max(1, total)) * 100)));
    const prevBest = st.bestScoreByNode[nodeId] ?? 0;
    const passedBefore = prevBest >= PASS_THRESHOLD;
    const passedNow = score >= PASS_THRESHOLD;

    if (score > prevBest) {
      st.bestScoreByNode[nodeId] = score;
    }

    let xpGain = 0;
    let unlockedNext = false;
    let completed = false;

    if (!passedBefore && passedNow) {
      const baseXp = XP_PER_KIND[node.kind] ?? 0;
      const xp = Math.round((score / 100) * baseXp);
      st.xpByNode[nodeId] = xp;
      st.totalXp += xp;
      xpGain = xp;

      st.statusMap[nodeId] = 'completed';
      completed = true;
      unlockedNext = this.unlockNextFrom(nodeId, st.statusMap);
    } else if (!passedNow) {
      if (!st.statusMap[nodeId] || st.statusMap[nodeId] === 'locked') {
        st.statusMap[nodeId] = 'unlocked';
      }
    }

    st.statusMap = this.applyGates(st.statusMap);
    this._state.set(st);

    // salva no Firestore em background
    this.saveToCloud();

    return { score, xpGain, unlockedNext, completed, passedNow };
  }

  // ===== Concluir atividade que não tem quiz (100% direto) =====
  completeById(id: string) {
    const st = { ...this._state() };

    const node = this.findNode(id);
    if (!node) return;

    const prevBest = st.bestScoreByNode[id] ?? 0;
    const alreadyPassed = prevBest >= PASS_THRESHOLD;

    st.statusMap[id] = 'completed';
    st.bestScoreByNode[id] = Math.max(prevBest, 100);

    if (!alreadyPassed) {
      const baseXp = XP_PER_KIND[node.kind] ?? 0;
      const xp = baseXp; // 100%
      st.xpByNode[id] = xp;
      st.totalXp += xp;
    }

    this.unlockNextFrom(id, st.statusMap);
    st.statusMap = this.applyGates(st.statusMap);

    this._state.set(st);

    // salva no Firestore em background
    this.saveToCloud();
  }

  // ===== Progresso por seção =====
  doneCount(sec: TrilhaSection, map = this._state().statusMap): number {
    let c = 0;
    for (const n of sec.nodes) if ((map[n.id] ?? 'locked') === 'completed') c++;
    return c;
  }

  sectionProgress(sec: TrilhaSection): number {
    const total = sec.nodes.length || 1;
    return Math.round((this.doneCount(sec) / total) * 100);
  }

  isSectionCompleted(sec: TrilhaSection, map = this._state().statusMap): boolean {
    return this.doneCount(sec, map) === sec.nodes.length;
  }

  // ===== RESET (zera local + nuvem) =====
  async reset() {
    const empty = this.emptyState();
    this._state.set(empty);
    this.bootstrapUnlocks();

    const ref = this.userDocRef();
    if (ref) {
      const payload: RemoteProgressDoc = {
        currentNodeId: null,
        totalXp: 0
      };
      try {
        console.log('[Trilha] reset: zerando doc remoto');
        await setDoc(ref, payload);
      } catch (e) {
        console.error('[Trilha] erro ao resetar progresso remoto', e);
      }
    }
  }

  // ===== GATES / HELPERS =====
  private bootstrapUnlocks() {
    const st = { ...this._state() };
    const map = { ...st.statusMap };

    for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
      const sec = SECTIONS[sIdx];
      for (let i = 0; i < sec.nodes.length; i++) {
        const id = sec.nodes[i].id;
        if (sIdx === 0 && i === 0) {
          // primeira atividade sempre desbloqueada
          if (!map[id] || map[id] === 'locked') map[id] = 'unlocked';
        } else {
          if (map[id] !== 'completed' && map[id] !== 'unlocked') map[id] = 'locked';
        }
      }
    }

    st.statusMap = map;
    this._state.set(st);
  }

  private applyGates(map: StatusMap): StatusMap {
    const clone = { ...map };
    const first = SECTIONS[0].nodes[0]?.id;
    if (first && (!clone[first] || clone[first] === 'locked')) clone[first] = 'unlocked';

    for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
      const sec = SECTIONS[sIdx];
      for (let i = 0; i < sec.nodes.length; i++) {
        const id = sec.nodes[i].id;
        if (sIdx === 0 && i === 0) continue;
        if (clone[id] !== 'completed' && clone[id] !== 'unlocked') clone[id] = 'locked';
      }
    }
    return clone;
  }

  private unlockNextFrom(nodeId: string, map: StatusMap): boolean {
    const pos = this.findPosition(nodeId);
    if (!pos) return false;
    const { section, index, sectionIdx } = pos;

    const next = section.nodes[index + 1];
    if (next && (map[next.id] ?? 'locked') === 'locked') {
      map[next.id] = 'unlocked';
      return true;
    }
    const nextSection = SECTIONS[sectionIdx + 1];
    if (nextSection) {
      const firstNext = nextSection.nodes[0];
      if ((map[firstNext.id] ?? 'locked') === 'locked') {
        map[firstNext.id] = 'unlocked';
        return true;
      }
    }
    return false;
  }

  // ===== Navegação =====
  isCurrent(sec: TrilhaSection, index: number): boolean {
    const firstUnlocked = sec.nodes.findIndex(n => this.getStatus(n.id) === 'unlocked');
    if (firstUnlocked !== -1) return index === firstUnlocked;

    const allCompleted = sec.nodes.every(n => this.getStatus(n.id) === 'completed');
    return allCompleted ? index === sec.nodes.length - 1 : false;
  }

  routeFor(id: string): string {
    return ROUTE_MAP[id] ?? '/trilha';
  }

  findNode(id: string): TrilhaNode | undefined {
    for (const s of SECTIONS) {
      const n = s.nodes.find(n => n.id === id);
      if (n) return n;
    }
    return undefined;
  }

  private findPosition(id: string) {
    for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
      const section = SECTIONS[sIdx];
      const index = section.nodes.findIndex(n => n.id === id);
      if (index >= 0) return { section, index, sectionIdx: sIdx };
    }
    return undefined;
  }
}
