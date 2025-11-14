// src/app/pages/trilha/etapa01/fase01/introducao/introducao.ts
import { Component, signal } from '@angular/core';
import { TrilhaProgressService } from '../../../../../core/trilha.service';
import { Router } from '@angular/router';

type Choice = 'V' | 'F' | null;

interface IntroQuestion {
  id: number;
  text: string;
  correct: Choice;
  user: Choice;
  explanation: string;
}

@Component({
  selector: 'app-introducao',
  standalone: true,
  templateUrl: './introducao.html',
  styleUrl: './introducao.scss'
})
export class Introducao {

  // conteúdo curto em passos (estilo duolingo)
  steps = [
    { icon:'🧠', title:'Consciência', text:'Saber para onde vai o dinheiro evita surpresas no fim do mês.' },
    { icon:'🧾', title:'Previsão',     text:'Planejar entradas e saídas ajuda a tomar decisões melhores.' },
    { icon:'🎯', title:'Objetivo',     text:'Com metas claras, fica mais fácil manter o foco e a motivação.' },
  ];

  // perguntas do quiz
  private _questions = signal<IntroQuestion[]>([
    {
      id: 1,
      text: 'Educação financeira é importante apenas para quem ganha muito dinheiro.',
      correct: 'F',
      user: null,
      explanation: 'Mesmo com renda baixa, saber organizar e planejar o dinheiro faz MUITA diferença no dia a dia.'
    },
    {
      id: 2,
      text: 'Anotar seus gastos ajuda a descobrir por onde o dinheiro está “escapando”.',
      correct: 'V',
      user: null,
      explanation: 'Quando você registra tudo, fica fácil enxergar gastos desnecessários e ajustar o orçamento.'
    },
    {
      id: 3,
      text: 'Ter um objetivo claro (como quitar dívidas ou fazer uma viagem) ajuda a manter o foco nas finanças.',
      correct: 'V',
      user: null,
      explanation: 'Objetivos dão direção: você sabe por que está economizando e fica mais motivado a continuar.'
    }
  ]);

  questions = this._questions.asReadonly();

  // marca se já clicou em "Concluir" (para controlar feedback)
  trilhaSubmit = false;

  constructor(
    private trilha: TrilhaProgressService,
    private router: Router
    ) {}

  // ========= LÓGICA DO QUIZ =========

  mark(choice: Choice, index: number) {
    this._questions.update(list => {
      const clone = [...list];
      clone[index] = { ...clone[index], user: choice };
      return clone;
    });
  }

  allAnswered(): boolean {
    return this._questions().every(q => q.user !== null);
  }

  private allCorrect(): boolean {
    return this._questions().every(q => q.user === q.correct);
  }

  // feedback geral (alerta verde/vermelho)
  showFeedback(): 'erro' | 'ok' | null {
    if (!this.trilhaSubmit) return null;

    if (!this.allAnswered()) {
      return 'erro'; // “responda tudo”
    }

    return this.allCorrect() ? 'ok' : 'erro';
  }

  // essa pergunta está correta?
  isQuestionCorrect(q: IntroQuestion): boolean {
    return q.user !== null && q.user === q.correct;
  }

  // devo mostrar o status/explicação dessa pergunta?
  // regra: só depois de clicar em CONCLUIR, e se a pergunta estiver errada
  shouldShowStatus(q: IntroQuestion): boolean {
    if (!this.trilhaSubmit) return false;   // ainda não clicou em Concluir
    if (q.user === null) return false;      // nem respondeu
    return q.user !== q.correct;           // só se estiver errada
  }

  // ========= AÇÃO "CONCLUIR" =========
  async concluir() {
  this.trilhaSubmit = true; // marca que tentou enviar

  if (!this.allAnswered()) {
    return; // ainda falta marcar alternativas
  }

  const ok = this.allCorrect();

  if (!ok) {
    return; // tem erro → só mostra feedback das perguntas
  }

  // tudo correto → salva progresso
  await this.trilha.completeById('sec1-n1');

  // agora redireciona depois de um tempinho
  setTimeout(() => {
    this.router.navigate(['/trilha']);
  }, 1800); // 1.8s para o aluno ver o feedback verde
}

  // Botão voltar para a página Trilha
  submitting = signal(false);

  voltar() {
    if (this.submitting()) return;
    this.router.navigate(['/trilha']);
  }
}
