import {
  Component, OnDestroy, OnInit, inject, signal, computed, effect, AfterViewInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { UserProfileService } from '../../core/user-profile.service';
import { Subscription } from 'rxjs';
import { ProfilePanelComponent } from '../../shared/profile-panel/profile-panel';
import { TransactionsService, TransacaoDoc } from '../../core/transactions.service';
import { GoalsService, GoalDoc } from '../../core/goals.service';
import { Chart } from 'chart.js/auto';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';



type Alerta = {
  tipo: 'categoria' | 'pico' | 'meta';
  texto: string;
  gravidade: 'low' | 'med' | 'high';
};

@Component({
  selector: 'app-home',
  standalone: true,
  // ✅ Inclua aqui:
  imports: [
    RouterLink,
    SafeUrlPipe,
    CommonModule, // fornece *ngIf, *ngFor e pipes básicos
    DecimalPipe, // pipe number
    NgIf, NgFor // opcional; já vem no CommonModule, mas não atrapalha
],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(Auth);
  private profileSvc = inject(UserProfileService);
  private tx = inject(TransactionsService);
  private goals = inject(GoalsService);

  private sub = new Subscription();
  showProfile = signal(false);

  openProfile()  { this.showProfile.set(true); }
  closeProfile() { this.showProfile.set(false); }
  toggleProfile(){ this.showProfile.update(v => !v); }

  /** Nome do usuário */
  firstName = signal<string>('Usuário');

  /** Período atual */
  mes = signal<number>(new Date().getMonth());
  ano = signal<number>(new Date().getFullYear());
  nomeMes = computed(() => {
    const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${nomes[this.mes()]} ${this.ano()}`;
  });

  /** Dados do mês */
  rows = signal<TransacaoDoc[]>([]);
  goal = signal<GoalDoc | null>(null);

  /** KPIs */
  totalEntradas = computed(() =>
    this.rows().filter(t => t.tipo==='entrada').reduce((s,t)=>s+t.valor, 0)
  );
  totalSaidas = computed(() =>
    this.rows().filter(t => t.tipo==='saida').reduce((s,t)=>s+t.valor, 0)
  );
  saldo = computed(() => this.totalEntradas() - this.totalSaidas());
  economiaMensal = computed(() => Math.max(this.saldo(), 0)); // “economia” = saldo positivo

  /** Progresso da meta: quanto do objetivo mensal já foi economizado */
  metaProgresso = computed(() => {
    const g = this.goal();
    if (!g || !g.valorMeta || g.valorMeta <= 0) return 0;
    const prog = Math.min(1, this.economiaMensal() / g.valorMeta);
    return +prog.toFixed(3);
  });

  /** Alertas (regras simples e eficazes) */
  alertas = computed<Alerta[]>(() => {
    const list: Alerta[] = [];
    const rows = this.rows();
    const totalSaidas = this.totalSaidas() || 1;

    // 1) Categoria “recorrente” (uma categoria sozinha > 35% das saídas)
    const byCat = new Map<string, number>();
    rows.filter(t=>t.tipo==='saida').forEach(t =>
      byCat.set(t.categoria, (byCat.get(t.categoria) ?? 0) + t.valor)
    );
    Array.from(byCat.entries())
      .sort((a,b)=>b[1]-a[1])
      .slice(0,3)
      .forEach(([cat, v]) => {
        const pct = (100*v/totalSaidas);
        if (pct >= 35) {
          list.push({
            tipo:'categoria',
            gravidade: pct >= 50 ? 'high':'med',
            texto: `Gasto elevado em "${cat}" (${pct.toFixed(0)}% das despesas). Considere revisar.`
          });
        }
      });

    // 2) Pico de gasto (saída acima de 20% do total mensal)
    const big = rows.filter(t=>t.tipo==='saida' && t.valor >= 0.2*totalSaidas);
    big.forEach(t => list.push({
      tipo:'pico', gravidade:'med',
      texto:`Despesa atípica de R$ ${t.valor.toFixed(2)} em ${t.categoria}.`
    }));

    // 3) Meta (se ainda não bateu e já passou de 70% do mês)
    const g = this.goal();
    if (g?.valorMeta && g.valorMeta > 0) {
      const hoje = new Date();
      const diasNoMes = new Date(this.ano(), this.mes()+1, 0).getDate();
      const dia = hoje.getDate();
      const passou70 = (dia/diasNoMes) >= 0.7;
      if (passou70 && this.economiaMensal() < g.valorMeta) {
        list.push({
          tipo:'meta', gravidade:'low',
          texto:`Meta de economia ainda não atingida (R$ ${this.economiaMensal().toFixed(2)} / R$ ${g.valorMeta.toFixed(2)}).`
        });
      }
    }

    return list;
  });

  /** Power BI (opcional). Se vazio, mostramos gráficos nativos. */
  powerBiUrl = signal<string>(''); // cole aqui a URL publicada do relatório se quiser usar Power BI

  // ===== Charts (nativos) =====
  private bar?: Chart;
  private donut?: Chart;

  constructor() {
    // Perfil → primeiro nome
    this.sub.add(
      this.profileSvc.profile$().subscribe(profile => {
        if (profile?.displayName) {
          this.firstName.set(this.getFirstName(profile.displayName));
        }
      })
    );
    // Fallback Auth
    const unsub = onAuthStateChanged(this.auth, (u) => {
      if (!u) {
        this.firstName.set('Usuário');
        return;
      }
      if (!this.firstName() || this.firstName()==='Usuário') {
        const n = u.displayName ?? (u.email?.split('@')[0] ?? 'Usuário');
        this.firstName.set(this.getFirstName(n));
      }
    });
    this.sub.add({ unsubscribe: () => unsub() });

    // Carrega mês e meta sempre que período mudar
    effect(() => {
      this.loadMonth();
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Render inicial dos gráficos nativos (se não usar Power BI)
    setTimeout(() => this.renderCharts(), 0);
    // Re-render quando as linhas mudarem
    effect(() => this.renderCharts());
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.bar?.destroy();
    this.donut?.destroy();
  }

  /** Navegação mês */
  mudarMes(delta:number){
    const d = new Date(this.ano(), this.mes(), 1);
    d.setMonth(d.getMonth()+delta);
    this.mes.set(d.getMonth());
    this.ano.set(d.getFullYear());
  }

  private async loadMonth() {
    // 1) Transações do mês (listener)
    this.tx.listenMonth(this.ano(), this.mes(), list => this.rows.set(list));

    // 2) Meta do mês (doc único)
    const g = await this.goals.getMonthGoal(this.ano(), this.mes());
    this.goal.set(g);
  }

  /** Previsão simples (média móvel das últimas N economias) */
  previsaoSaldo(N=3): number {
    // Pega últimos N saldos mensais (consultando serviço)
    // Implementação simples: GoalsService fornece util. Se não houver, usa economia atual.
    return this.economiaMensal();
  }

  /** Gráficos nativos (se PowerBI não estiver configurado) */
  private renderCharts() {
    if (this.powerBiUrl()) return; // usando PowerBI → não render nativo

    // ---- Bar: fluxo (entradas vs saídas) ----
    const barEl = document.getElementById('barChart') as HTMLCanvasElement | null;
    if (barEl) {
      this.bar?.destroy();
      this.bar = new Chart(barEl, {
        type:'bar',
        data:{
          labels:['Entradas','Saídas','Saldo'],
          datasets:[{
            data:[this.totalEntradas(), this.totalSaidas(), this.saldo()],
          }]
        },
        options:{
          plugins:{ legend:{display:false} },
          scales:{ x:{ grid:{display:false} }, y:{ grid:{color:'rgba(255,255,255,.06)'} } }
        }
      });
    }

    // ---- Donut: por categoria (saídas) ----
    const donutEl = document.getElementById('donutChart') as HTMLCanvasElement | null;
    if (donutEl) {
      const byCat = new Map<string, number>();
      this.rows().filter(t=>t.tipo==='saida').forEach(t =>
        byCat.set(t.categoria, (byCat.get(t.categoria) ?? 0) + t.valor)
      );
      const labels = Array.from(byCat.keys());
      const data = Array.from(byCat.values());
      this.donut?.destroy();
      this.donut = new Chart(donutEl, {
        type:'doughnut',
        data:{ labels, datasets:[{ data }]},
        options:{ cutout:'60%', plugins:{ legend:{ display:false }}}
      });
    }
  }

  private getFirstName(fullName: string): string {
    return (fullName ?? '').trim().split(/\s+/)[0] || 'Usuário';
  }
}
