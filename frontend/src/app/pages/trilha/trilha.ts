// src/app/pages/trilha/trilha.ts
import { Component, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type NodoState = 'locked' | 'current' | 'done';

interface Nodo {
  id: number;
  title: string;
  route: string;
  emoji: string;
  color: string;
  state: NodoState;
}

@Component({
  selector: 'app-trilha',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trilha.html',
  styleUrl: './trilha.scss'
})
export class Trilha implements AfterViewInit {
  activeIndex = signal<number>(1);

  nodos: Nodo[] = [
    { id: 1, title: 'Introdução', route: '/trilha/Introducao', emoji: '👋', color: '#00c053', state: 'done' },
    { id: 2, title: 'Orçamento', route: '/trilha/Orcamento', emoji: '📊', color: '#01a44b', state: 'current' },
    { id: 3, title: 'Controle de Gastos', route: '/trilha/controledeGastos', emoji: '🛒', color: '#00b894', state: 'locked' },
    { id: 4, title: 'Reserva', route: '/trilha/Reserva', emoji: '🏦', color: '#fdcb6e', state: 'locked' },
    { id: 5, title: 'Cartão e Juros', route: '/trilha/cartao-juros', emoji: '💳', color: '#6c5ce7', state: 'locked' },
    { id: 6, title: 'Investimentos', route: '/trilha/investimentos', emoji: '📈', color: '#0984e3', state: 'locked' },
    { id: 7, title: 'Meta Financeira', route: '/trilha/meta-financeira', emoji: '🎯', color: '#e17055', state: 'locked' },
    { id: 8, title: 'Conclusão', route: '/trilha/conclusao', emoji: '🏆', color: '#d63031', state: 'locked' },
  ];

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToActive(), 120);
  }

  abrirNodo(i: number): void {
    const nodo = this.nodos[i];
    if (nodo.state === 'locked') return;
    this.activeIndex.set(i);
    this.scrollToActive();
  }

  concluirNodo(i: number): void {
    if (this.nodos[i].state === 'locked') return;
    this.nodos[i].state = 'done';

    const next = this.nodos[i + 1];
    if (next && next.state === 'locked') {
      next.state = 'current';
      this.activeIndex.set(i + 1);
      setTimeout(() => this.scrollToActive(), 80);
    }
  }

  getNodoRoute(nodo: Nodo): string {
    return nodo.route;
  }

  getNodoClass(nodo: Nodo): string {
    return nodo.state;
  }

  scrollToActive(): void {
    const idx = this.activeIndex();
    const el = document.getElementById(`nodo-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  resetTrilha(): void {
    this.nodos.forEach((n, i) => (n.state = i === 0 ? 'current' : 'locked'));
    this.activeIndex.set(0);
    setTimeout(() => this.scrollToActive(), 150);
  }








}
