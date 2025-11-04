import { Injectable, signal, WritableSignal } from '@angular/core'; /**Service para utilizar na Trilha de Aprendizagem. */

export type NodeStatus = 'locked' | 'unlocked' | 'completed'; /**Define o tipo de status  onde chama o NodeStatus que aceita apenas estes 3 valores. */
export type NodeKind   = 'lesson' | 'game'; /**Criação do nó entre as atividades. */

export interface TrilhaNode     { id: string; kind: NodeKind; title: string; emoji: string; } /**Estrutura de como o nó de atividades deve ser (id, tipo de unidade, título e ícone). */
export interface TrilhaSection  { id: string; title: string; nodes: TrilhaNode[]; } /**Interface que representa seção (Ex: Introdução a Gestão Financeira e suas 5 atividades). */

const STORAGE_KEY = 'moneva.trilha.status.v2';

// Aqui é armazenado toda as informações das atividades e tópicos (Títulos, tipo de atividade, id, emoji...)
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

// Mapa de rotas por atividade, usado pelo template via routeFor(id) */
const ROUTE_MAP: Record<string, string> = {
  // sec1
  'sec1-n1': '/trilha/Introducao',
  'sec1-n2': '/trilha/quiz-dinheiro',
  'sec1-n3': '/trilha/educacao-financeira',

  // sec2 
  'sec2-n1': '/trilha/orcamento',
  'sec2-n2': '/trilha/monte-orcamento',
  'sec2-n3': '/trilha/orcamento-dicas',
  'sec2-n4': '/trilha/desafio-fim-mes',
  'sec2-n5': '/trilha/ferramentas-planejamento',
  // sec3 
  'sec3-n1': '/trilha',
  'sec3-n2': '/trilha',
  'sec3-n3': '/trilha',
  'sec3-n4': '/trilha',
  'sec3-n5': '/trilha',
};

@Injectable({ providedIn: 'root' })
export class TrilhaProgressService {
  private _status: WritableSignal<Record<string, NodeStatus>> = signal(this.load());
  /** leitura somente */
  status = this._status.asReadonly();

  get sections(): TrilhaSection[] { return SECTIONS; }

  constructor() {
    this.bootstrapUnlocks();
  }

  // ===== STATUS =====
  getStatus(id: string): NodeStatus {
    return this._status()[id] ?? 'locked';
  }

  // ===== CONCLUSÃO + DESBLOQUEIO =====
  completeById(id: string) {
    const map = { ...this._status() };
    map[id] = 'completed';

    const pos = this.findPosition(id);
    if (pos) {
      const { section, index, sectionIdx } = pos;

      // libera o próximo da mesma seção
      const next = section.nodes[index + 1];
      if (next && (map[next.id] ?? 'locked') === 'locked') {
        map[next.id] = 'unlocked';
      }

      // seção 100% → libera a primeira da próxima seção
      if (this.isSectionCompleted(section, map)) {
        const nextSection = SECTIONS[sectionIdx + 1];
        if (nextSection) {
          const firstNext = nextSection.nodes[0];
          if ((map[firstNext.id] ?? 'locked') === 'locked') {
            map[firstNext.id] = 'unlocked';
          }
        }
      }
    }

    this._status.set(map);
    this.persist();
  }

  // ===== PROGRESSO (para pintar a espinha da seção) =====
  doneCount(sec: TrilhaSection, map = this._status()): number {
    let c = 0;
    for (const n of sec.nodes) if ((map[n.id] ?? 'locked') === 'completed') c++;
    return c;
  }

  sectionProgress(sec: TrilhaSection): number {
    const total = sec.nodes.length || 1;
    return Math.round((this.doneCount(sec) / total) * 100);
  }

  isSectionCompleted(sec: TrilhaSection, map = this._status()): boolean {
    return this.doneCount(sec, map) === sec.nodes.length;
  }

  // ===== INICIALIZAÇÃO (gate entre seções) =====
  private bootstrapUnlocks() {
    const map = { ...this._status() };

    // só o 1º da 1ª seção desbloqueado; o resto fica locked (a menos que já esteja completed)
    for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
      const sec = SECTIONS[sIdx];
      for (let i = 0; i < sec.nodes.length; i++) {
        const id = sec.nodes[i].id;
        if (sIdx === 0 && i === 0) {
          if (!map[id] || map[id] === 'locked') map[id] = 'unlocked';
        } else {
          if (map[id] !== 'completed') map[id] = 'locked';
        }
      }
    }

    this._status.set(map);
    this.persist();
  }

  // ===== HELPERS =====
  reset() {
    this._status.set({});
    this.persist();
    this.bootstrapUnlocks();
  }

  /** progresso do nó para o anel (0 ou 100) */
  nodeProgress(id: string): number {
    return this.getStatus(id) === 'completed' ? 100 : 0;
  }

  /** define qual item é o 'atual' na seção (badge COMEÇAR) */
  isCurrent(sec: TrilhaSection, index: number): boolean {
    const firstUnlocked = sec.nodes.findIndex(n => this.getStatus(n.id) === 'unlocked');
    if (firstUnlocked !== -1) return index === firstUnlocked;

    const allCompleted = sec.nodes.every(n => this.getStatus(n.id) === 'completed');
    return allCompleted ? index === sec.nodes.length - 1 : false;
  }

  /** rota correspondente ao id do nó (usado no [routerLink]) */
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

  private load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._status()));
  }
}


