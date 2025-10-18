// src/app/pages/demonstrativos/demonstrativos.ts
import {
  Component, AfterViewInit, OnDestroy, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { RouterLink } from '@angular/router';

type Tipo = 'entrada' | 'saida';
type Meio = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'boleto' | 'outro';

interface Transacao {
  id: string;
  data: Date;
  tipo: Tipo;
  categoria: string;
  valor: number;
  meio: Meio;
  obs?: string;
}

interface CategoriaCfg {
  nome: string;
  emoji: string;
  cor: string;       // cor no gráfico
}

@Component({
  selector: 'app-demonstrativos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demonstrativos.html',
  styleUrl: './demonstrativos.scss'
})
export class Demonstrativos implements AfterViewInit, OnDestroy {

  // ======= Estado base =======
  readonly paletaFundo = ['#2a2f35','#21252a','#1b1f24','#171a1d'];
  readonly green = '#00c053';

  // Mês/ano exibidos (mock por enquanto)
  mes = signal<number>(new Date().getMonth());
  ano = signal<number>(new Date().getFullYear());

  // categorias com cores/emoji
  categorias: CategoriaCfg[] = [
    { nome: 'Mercado',      emoji: '🛒', cor: '#00b894' },
    { nome: 'Transporte',   emoji: '🚗', cor: '#0984e3' },
    { nome: 'Lazer',        emoji: '🎮', cor: '#6c5ce7' },
    { nome: 'Moradia',      emoji: '🏠', cor: '#fdcb6e' },
    { nome: 'Saúde',        emoji: '💊', cor: '#e17055' },
    { nome: 'Presentes',    emoji: '🎁', cor: '#d63031' },
    { nome: 'Educação',     emoji: '🎓', cor: '#e84393' },
    { nome: 'Outros',       emoji: '📦', cor: '#636e72' },
  ];

  // Transações mock (você pode plugar o Firestore depois)
  transacoes: Transacao[] = [
    { id: crypto.randomUUID(), data: new Date(),  tipo:'entrada', categoria:'Salário',  valor: 2500, meio:'pix' },
    { id: crypto.randomUUID(), data: new Date(),  tipo:'saida',   categoria:'Mercado',  valor: 420,  meio:'debito' },
    { id: crypto.randomUUID(), data: new Date(),  tipo:'saida',   categoria:'Transporte', valor: 160, meio:'dinheiro' },
    { id: crypto.randomUUID(), data: new Date(),  tipo:'saida',   categoria:'Lazer',    valor: 80,   meio:'credito' },
    { id: crypto.randomUUID(), data: new Date(),  tipo:'saida',   categoria:'Moradia',  valor: 540,  meio:'boleto' },
  ];

  // Modais simples
  showAdd = signal(false);
  showConfirm = signal<{open:boolean, id?:string}>({open:false});

  // Form simples do modal de adicionar
  novo: Partial<Transacao> = {
    data: new Date(),
    tipo: 'saida',
    categoria: 'Mercado',
    valor: 0,
    meio: 'pix',
    obs: ''
  };

  // Converte Date → string "yyyy-MM-dd" para o <input type="date">
  dateToInput(d?: Date): string {
    const dt = d ?? new Date();
    // Corrige timezone para não "voltar um dia" em alguns navegadores
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  // Trata mudança do <input type="date"> e guarda em this.novo.data
  onDateChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    // adiciono T00:00:00 para evitar conversões de fuso
    this.novo.data = input.value ? new Date(input.value + 'T00:00:00') : new Date();
  }

  // Chart
  private chart?: Chart;

  // ======= Cálculos =======
  get totalEntradas(): number {
    return this.transacoes
      .filter(t => t.tipo==='entrada')
      .reduce((acc,t)=> acc + t.valor, 0);
  }
  get totalSaidas(): number {
    return this.transacoes
      .filter(t => t.tipo==='saida')
      .reduce((acc,t)=> acc + t.valor, 0);
  }
  get saldo(): number {
    return this.totalEntradas - this.totalSaidas;
  }

  // gastos por categoria (apenas saídas)
  get gastosPorCategoria(): {nome: string; emoji: string; cor:string; valor:number; pct:number}[] {
    const totSaidas = this.totalSaidas || 1;
    const mapa = new Map<string, number>();
    for (const t of this.transacoes) {
      if (t.tipo==='saida') {
        const key = t.categoria;
        mapa.set(key, (mapa.get(key) ?? 0) + t.valor);
      }
    }
    // ordena por valor desc e injeta config de cor/emoji
    return Array.from(mapa.entries())
      .map(([nome, valor]) => {
        const cfg = this.categorias.find(c=>c.nome===nome) ?? {nome, emoji:'📦', cor:'#636e72'};
        return { nome: cfg.nome, emoji: cfg.emoji, cor: cfg.cor, valor, pct: +(100*valor/totSaidas).toFixed(0) };
      })
      .sort((a,b)=> b.valor - a.valor);
  }

  // ======= Ciclo =======
  ngAfterViewInit(): void {
    this.renderChart();
  }
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart() {
    const el = document.getElementById('ringChart') as HTMLCanvasElement | null;
    if (!el) return;

    const labels = this.gastosPorCategoria.map(g => `${g.emoji} ${g.nome}`);
    const data   = this.gastosPorCategoria.map(g => g.valor);
    const colors = this.gastosPorCategoria.map(g => g.cor);

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
      options: {
        cutout: '62%',
        plugins: {
          legend: { display:false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const label = ctx.label || '';
                const v = ctx.parsed as number;
                return `${label}: R$ ${v.toFixed(2).replace('.',',')}`;
              }
            }
          }
        }
      }
    });
  }

  // ======= UI =======
  mudarMes(delta: number) {
    const d = new Date(this.ano(), this.mes(), 1);
    d.setMonth(d.getMonth()+delta);
    this.mes.set(d.getMonth());
    this.ano.set(d.getFullYear());
    // quando tiver filtros por período, recarregue aqui
  }

  abrirAdd(tipo: Tipo) {
    this.novo = {
      data: new Date(), tipo, categoria: 'Mercado', valor: 0, meio: 'pix', obs:''
    };
    this.showAdd.set(true);
  }
  fecharAdd() { this.showAdd.set(false); }

  salvarTransacao() {
    if (!this.novo.tipo || !this.novo.categoria || !this.novo.valor) return;
    this.transacoes.unshift({
      id: crypto.randomUUID(),
      data: this.novo.data ?? new Date(),
      tipo: this.novo.tipo,
      categoria: this.novo.categoria!,
      valor: Number(this.novo.valor),
      meio: this.novo.meio ?? 'pix',
      obs: this.novo.obs
    });
    this.showAdd.set(false);
    this.renderChart();
  }

  confirmarExcluir(id: string) {
    this.showConfirm.set({open:true, id});
  }
  cancelarExcluir() {
    this.showConfirm.set({open:false});
  }
  excluirConfirmado() {
    const id = this.showConfirm().id!;
    this.transacoes = this.transacoes.filter(t => t.id !== id);
    this.showConfirm.set({open:false});
    this.renderChart();
  }

  // helpers de data → “Outubro 2025”
  nomeMes(): string {
    const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${nomes[this.mes()]} ${this.ano()}`;
  }

  
}
