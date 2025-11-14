// src/app/pages/trilha/etapa01/fase03/educacao-financeira/educacao-financeira.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../core/trilha.service';

type Choice = 'V' | 'F' | null;

interface EduQuestion {
  id: number;
  text: string;
  correct: Choice;
  user: Choice;
  explanation: string;
}

@Component({
  selector: 'app-educacao-financeira',
  standalone: true,
  templateUrl: './educacao-financeira.html',
  styleUrl: './educacao-financeira.scss'
})
export class EducacaoFinanceira {

  constructor(
    private router: Router,
    private trilha: TrilhaProgressService
  ) {}

  // Conteúdo curto (mesmo estilo da Atividade 01)
  steps = [
    { icon:'💡', title:'Entendimento', text:'Com educação financeira, você entende o impacto das suas escolhas de consumo.' },
    { icon:'📈', title:'Crescimento',   text:'Organização e constância permitem investir e realizar objetivos reais.' },
    { icon:'🧘', title:'Tranquilidade', text:'Planejamento reduz o estresse e dá mais segurança para o futuro.' },
  ];

  // Perguntas com gabarito + explicação
  private _questions = signal<EduQuestion[]>([
    {
      id: 1,
      text: 'Educação financeira envolve hábitos do dia a dia, não apenas investimentos.',
      correct: 'V',
      user: null,
      explanation: 'Ela não é só sobre aplicações financeiras: envolve como você gasta, poupa e se organiza no cotidiano.'
    },
    {
      id: 2,
      text: 'Ter controle financeiro ajuda a tomar decisões melhores e mais conscientes.',
      correct: 'V',
      user: null,
      explanation: 'Quando você sabe quanto entra e quanto sai, fica mais fácil decidir se pode gastar ou se é melhor esperar.'
    },
    {
      id: 3,
      text: 'Se eu ganho pouco, não faz diferença anotar gastos ou planejar.',
      correct: 'F',
      user: null,
      explanation: 'Mesmo com renda baixa, anotar e planejar ajuda a cortar excessos e sair do aperto aos poucos.'
    }
  ]);

  questions = this._questions.asReadonly();

  // se o usuário já clicou em "Concluir"
  trilhaSubmit = false;

  // ======== LÓGICA DO QUIZ ========

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

  // feedback geral (alerta embaixo do quiz)
  showFeedback(): 'erro' | 'ok' | null {
    if (!this.trilhaSubmit) return null;

    if (!this.allAnswered()) {
      return 'erro'; // ainda falta marcar alternativas
    }

    return this.allCorrect() ? 'ok' : 'erro';
  }

  // essa pergunta está correta?
  isQuestionCorrect(q: EduQuestion): boolean {
    return q.user !== null && q.user === q.correct;
  }

  // devo mostrar o status/explicação dessa pergunta?
  // regra: só depois de clicar em CONCLUIR, e se a pergunta estiver errada
  shouldShowStatus(q: EduQuestion): boolean {
    if (!this.trilhaSubmit) return false;
    if (q.user === null) return false;
    return q.user !== q.correct;
  }

  // ======== AÇÃO "CONCLUIR" ========
  async concluir() {
    this.trilhaSubmit = true; // marca que tentou enviar

    if (!this.allAnswered()) {
      // falta responder coisa → só mostra alerta vermelho
      return;
    }

    const ok = this.allCorrect();
    if (!ok) {
      // tem erro → mostra feedback por pergunta + alerta
      return;
    }

    // tudo certo: marca a atividade 03 como concluída e libera a próxima
    await this.trilha.completeById('sec1-n3');

    // feedback verde + volta pra trilha depois de um tempinho
    setTimeout(() => {
      this.router.navigate(['/trilha']);
    }, 800);
  }

  // Botão voltar direto pra trilha
  voltar() {
    this.router.navigate(['/trilha']);
  }
}
