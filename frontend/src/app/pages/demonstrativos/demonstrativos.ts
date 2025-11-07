import { Component, AfterViewInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, TitleCasePipe, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { RouterLink } from '@angular/router';
import { TransactionsService, TransacaoDoc, Tipo, Meio } from '../../core/transactions.service';
import { Timestamp } from '@angular/fire/firestore';

type Filtro = {
  tipo: 'todas' | 'entrada' | 'saida';
  meio: Meio | 'todos';
  categoria: string | 'todas';
  start: string | null;  // 'YYYY-MM-DD'
  end: string | null;
  q: string;             // busca por obs
  valor: number | null;  // busca por valor exato
};

const DEFAULT_FILTRO: Filtro = {
  tipo: 'todas',
  meio: 'todos',
  categoria: 'todas',
  start: null,
  end: null,
  q: '',
  valor: null
};

// meios válidos (mantém compatível com rules e com o tipo Meio)
const MEIOS_VALIDOS = ['pix','dinheiro','debito','credito','boleto','outro'] as const;
type MeioValido = typeof MEIOS_VALIDOS[number];

@Component({
  selector: 'app-demonstrativos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe, DatePipe, TitleCasePipe],
  templateUrl: './demonstrativos.html',
  styleUrl: './demonstrativos.scss'
})
export class Demonstrativos implements AfterViewInit, OnDestroy {
  private tx = inject(TransactionsService);
  private doc = inject(DOCUMENT);

  // ======= Calendário do gráfico =======
  mes = signal<number>(new Date().getMonth());
  ano = signal<number>(new Date().getFullYear());
  nomeMes = computed(() => {
    const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${nomes[this.mes()]} ${this.ano()}`;
  });

  // ======= Estado UI =======
  showAdd = signal(false);
  showConfirm = signal<{open:boolean, id?:string}>({open:false});
  showFilter = signal(false);
  showSearch = signal(false);
  showMenu = signal(false);
  showTrash = signal(false);

  // ======= Dados =======
  categorias = [
    { nome: 'Mercado',    emoji: '🛒', cor: '#00b894' },
    { nome: 'Transporte', emoji: '🚗', cor: '#0984e3' },
    { nome: 'Lazer',      emoji: '🎮', cor: '#6c5ce7' },
    { nome: 'Moradia',    emoji: '🏠', cor: '#fdcb6e' },
    { nome: 'Saúde',      emoji: '💊', cor: '#e17055' },
    { nome: 'Presentes',  emoji: '🎁', cor: '#d63031' },
    { nome: 'Educação',   emoji: '🎓', cor: '#e84393' },
    { nome: 'Outros',     emoji: '📦', cor: '#636e72' },
  ];

  // Carregado do Firestore para o mês
  private unsub?: () => void;
  rows = signal<TransacaoDoc[]>([]);

  // Filtros/busca
  filtro = signal<Filtro>({ ...DEFAULT_FILTRO });

  // util p/ atualizar filtro (evita spread no template)
  updateFiltro<K extends keyof Filtro>(key: K, value: Filtro[K]) {
    this.filtro.update(f => ({ ...f, [key]: value }));
  }

  // ✅ Indica se algum filtro está ativo (diferente do padrão)
  hasFilter = computed(() => {
    const f = this.filtro();
    const d = DEFAULT_FILTRO;
    return (
      f.tipo !== d.tipo ||
      f.meio !== d.meio ||
      f.categoria !== d.categoria ||
      f.start !== d.start ||
      f.end !== d.end ||
      (f.q?.trim() ?? '') !== d.q ||
      f.valor !== d.valor
    );
  });

  // ✅ Reseta para o padrão
  resetFiltro() {
    this.filtro.set({ ...DEFAULT_FILTRO });
  }

  // Novo registro (modal existente)
  novo: Partial<TransacaoDoc> = {
    date: Timestamp.fromDate(new Date()),
    tipo: 'saida',
    categoria: 'Mercado',
    valor: 0,
    meio: 'pix',
    obs: ''
  };

  // ========= Derivados (com filtros) =========
  filtered = computed(() => {
    const all = this.rows();
    const f = this.filtro();
    return all.filter((t) => {
      if (t.deletedAt) return false;

      if (f.tipo !== 'todas' && t.tipo !== f.tipo) return false;
      if (f.meio !== 'todos' && t.meio !== f.meio) return false;
      if (f.categoria !== 'todas' && t.categoria !== f.categoria) return false;

      if (f.start) {
        const ts = new Date(f.start + 'T00:00:00').getTime();
        if (t.date.toMillis() < ts) return false;
      }
      if (f.end) {
        const te = new Date(f.end + 'T23:59:59').getTime();
        if (t.date.toMillis() > te) return false;
      }
      if (f.q && !`${t.obs ?? ''}`.toLowerCase().includes(f.q.toLowerCase())) return false;
      if (f.valor != null && f.valor !== 0 && Math.abs(t.valor - f.valor) > 0.0001) return false;

      return true;
    });
  });

  totalEntradas = computed(() =>
    this.filtered().filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  );
  totalSaidas = computed(() =>
    this.filtered().filter(t => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0)
  );
  saldo = computed(() => this.totalEntradas() - this.totalSaidas());

  gastosPorCategoria = computed(() => {
    const saidas = this.filtered().filter(t => t.tipo === 'saida');
    const tot = saidas.reduce((s,t)=>s+t.valor, 0) || 1;
    const map = new Map<string, number>();
    saidas.forEach(t => map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.valor));
    return Array.from(map.entries()).map(([nome, valor]) => {
      const cfg = this.categorias.find(c => c.nome === nome) ?? { nome, emoji:'📦', cor:'#636e72' };
      return { nome: cfg.nome, emoji: cfg.emoji, cor: cfg.cor, valor, pct: Math.round(100*valor/tot) };
    }).sort((a,b)=> b.valor - a.valor);
  });

  // ======= Chart =======
  private chart?: Chart;
  ngAfterViewInit() { this.renderChart(); }
  ngOnDestroy() { this.chart?.destroy(); this.unsub?.(); }

  constructor() {
    // carrega mês inicial
    effect(() => { this.subscribeMonth(); });

    // re-render quando dados filtrados mudarem
    effect(() => { this.renderChart(); });

    // FAB inteligente (vira fixo/solto)
    setTimeout(() => this.initFabObserver(), 0);
  }

  private subscribeMonth() {
    this.unsub?.();
    this.unsub = this.tx.listenMonth(this.ano(), this.mes(), list => this.rows.set(list));
  }

  mudarMes(delta: number) {
    const d = new Date(this.ano(), this.mes(), 1);
    d.setMonth(d.getMonth() + delta);
    this.mes.set(d.getMonth());
    this.ano.set(d.getFullYear());
    this.subscribeMonth();
  }

  // Helpers de data para <input type="date">
  dateToInput(ts?: any): string {
    const d: Date = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date());
    const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,10);
  }

  onDateChange(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    const d = new Date(v + 'T00:00:00');
    this.novo.date = Timestamp.fromDate(d);
  }

  abrirAdd(tipo: Tipo) {
    this.novo = {
      date: Timestamp.fromDate(new Date()),
      tipo,
      categoria: 'Mercado',
      valor: 0,
      meio: 'pix',
      obs: ''
    };
    this.showAdd.set(true);
  }

  fecharAdd() { this.showAdd.set(false); }

  async salvarTransacao() {
    const n = this.novo;
    if (!n.tipo || !n.categoria || n.valor == null || !n.date || !n.meio) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const valorNum = Number(n.valor);
      if (Number.isNaN(valorNum) || valorNum < 0) {
        alert('Informe um valor válido (número >= 0).');
        return;
      }

      await this.tx.add({
        date: n.date,
        tipo: n.tipo,
        categoria: n.categoria,
        valor: valorNum,
        meio: n.meio,
        obs: n.obs ?? ''
      } as TransacaoDoc);

      // Ajusta o mês exibido para o mês da transação salva
      const d = n.date.toDate();
      const mKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const viewKey = `${this.ano()}-${String(this.mes()+1).padStart(2,'0')}`;
      if (mKey !== viewKey) {
        this.ano.set(d.getFullYear());
        this.mes.set(d.getMonth());
        this.subscribeMonth();
      }

      this.showAdd.set(false);
    } catch (e:any) {
      console.error(e);
      if (String(e?.message).includes('not-authenticated')) {
        alert('Sua sessão expirou. Faça login novamente.');
      } else {
        alert('Não foi possível salvar. Tente novamente.');
      }
    }
  }

  confirmarExcluir(id: string) { this.showConfirm.set({open:true, id}); }
  cancelarExcluir() { this.showConfirm.set({open:false}); }
  async excluirConfirmado() {
    const id = this.showConfirm().id!;
    await this.tx.softDelete(id);
    this.showConfirm.set({open:false});
  }

  // ======= Chart =======
  private renderChart() {
    const el = document.getElementById('ringChart') as HTMLCanvasElement | null;
    if (!el) return;
    const labels = this.gastosPorCategoria().map(g => `${g.emoji} ${g.nome}`);
    const data   = this.gastosPorCategoria().map(g => g.valor);
    const colors = this.gastosPorCategoria().map(g => g.cor);

    this.chart?.destroy();
    this.chart = new Chart(el, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#101315',
          borderWidth: 4,
          hoverOffset: 6
        }]
      },
      options: { cutout: '62%', plugins: { legend: { display:false } } }
    });
  }

  // ======= FAB inteligente (fixo no saldo / flutuante em baixo) =======
  private initFabObserver() {
    const saldo = document.querySelector('.saldo-bar');
    const wrap  = document.querySelector('.fab-smart');
    if (!saldo || !wrap) return;
    const io = new IntersectionObserver(([e]) => {
      e.isIntersecting ? wrap.classList.remove('floating') : wrap.classList.add('floating');
    }, { threshold: 0.01 });
    io.observe(saldo);
  }

  // ===== Ações do topo =====
  abrirFiltro(){ this.showFilter.set(true); }
  fecharFiltro(){ this.showFilter.set(false); }
  abrirBusca(){ this.showSearch.set(true); }
  fecharBusca(){ this.showSearch.set(false); }
  abrirMenu(){ this.showMenu.set(!this.showMenu()); }

  // lixeira
  trash = signal<TransacaoDoc[]>([]);
  trashLoading = signal(false);

  async abrirLixeira(){
    this.showMenu.set(false);
    this.showTrash.set(true);
    this.trashLoading.set(true);
    try {
      const list = await this.tx.listTrash(100);
      this.trash.set(list);
    } finally {
      this.trashLoading.set(false);
    }
  }

  fecharLixeira(){ this.showTrash.set(false); }

  async restaurar(item: TransacaoDoc){
    try {
      await this.tx.restore(item.id!);
      this.trash.update(arr => arr.filter(x => x.id !== item.id));
    } catch(e){
      console.error(e);
      alert('Não foi possível restaurar. Tente novamente.');
    }
  }

  // tema
  setTheme(mode: 'dark' | 'light' | '') {
    this.doc.body.dataset['theme'] = mode;
    this.showMenu.set(false);
  }

  // busca por valor
  onValorChange(val: any) {
    const v = (val === '' || val === null || val === undefined) ? null : Number(val);
    this.updateFiltro('valor', (v !== null && Number.isNaN(v)) ? null : v);
  }

  // ====== Edição ======
  showEdit = signal(false);
  formEdit: { id?: string; categoria: string; valor: number; meio: MeioValido; obs: string | null } = {
    categoria: '', valor: 0, meio: 'pix', obs: null
  };

  abrirEditar(t: TransacaoDoc) {
    this.formEdit = {
      id: t.id!,
      categoria: t.categoria,
      valor: Number(t.valor) || 0,
      meio: (t.meio as MeioValido) ?? 'pix',
      obs: t.obs ?? null,
    };
    this.showEdit.set(true);
  }

  fecharEditar() {
    this.showEdit.set(false);
  }

  async salvarEdicao() {
    const id = this.formEdit.id!;
    const valor = Number(this.formEdit.valor);
    const categoria = (this.formEdit.categoria || '').trim();
    const meio = this.formEdit.meio;
    const obsClean = (this.formEdit.obs ?? '').trim(); // <- normaliza

    if (!id) return;
    if (!categoria) { alert('Informe a categoria.'); return; }
    if (!isFinite(valor) || valor <= 0) { alert('Informe um valor válido.'); return; }
    if (!['pix','dinheiro','debito','credito','boleto','outro'].includes(meio)) {
      alert('Selecione um meio de pagamento válido.');
      return;
    }

    try {
      // Só inclui "obs" no patch se houver conteúdo
      const patch: Partial<Pick<TransacaoDoc,'valor'|'categoria'|'meio'|'obs'>> = {
        valor, categoria, meio,
        ...(obsClean ? { obs: obsClean } : {}) // <- não manda null
      };

      await this.tx.update(id, patch);
      this.showEdit.set(false);
    } catch (e:any) {
      console.error(e);
      alert('Não foi possível salvar a edição. Tente novamente.');
    }
  }

}
