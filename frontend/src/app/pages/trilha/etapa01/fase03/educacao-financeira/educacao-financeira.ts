import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../trilha/trilha-progress';

type Choice = 'V' | 'F' | null;

@Component({
  selector: 'app-educacao-financeira',
  standalone: true,
  templateUrl: './educacao-financeira.html',
  styleUrl: './educacao-financeira.scss'
})
export class EducacaoFinanceira {

  constructor(private router: Router, private progress: TrilhaProgressService) {}

  // Conteúdo curto (mesmo estilo da Atividade 01)
  steps = [
    { icon:'💡', title:'Entendimento', text:'Com educação financeira, você entende o impacto das suas escolhas de consumo.' },
    { icon:'📈', title:'Crescimento',   text:'Organização e constância permitem investir e realizar objetivos reais.' },
    { icon:'🧘', title:'Tranquilidade', text:'Planejamento reduz o estresse e dá mais segurança para o futuro.' },
  ];

  // Mini-quiz COM perguntas diferentes das outras atividades
  questions = signal([
    { id: 1, text: 'Educação financeira envolve hábitos do dia a dia, não apenas investimentos.', answer: 'V' as Exclude<Choice, null>, user: null as Choice },
    { id: 2, text: 'Ter controle financeiro ajuda a tomar decisões melhores e mais conscientes.',  answer: 'V' as Exclude<Choice, null>, user: null as Choice },
    { id: 3, text: 'Se eu ganho pouco, não faz diferença anotar gastos ou planejar.',             answer: 'F' as Exclude<Choice, null>, user: null as Choice },
  ]);

  // estados de UI
  showFeedback = signal<null | 'ok' | 'erro'>(null);
  allAnswered = computed(() => this.questions().every(q => q.user !== null));
  allCorrect  = computed(() => this.questions().every(q => q.user === q.answer));

  mark(choice: Choice, index: number) {
    this.questions.update(arr => {
      const copy = [...arr];
      copy[index] = { ...copy[index], user: choice };
      return copy;
    });
    this.showFeedback.set(null);
  }

  concluir() {
    if (!this.allAnswered() || !this.allCorrect()) {
      this.showFeedback.set('erro');
      return;
    }

    this.progress.completeById('sec1-n3');
    this.showFeedback.set('ok');

    // mesmo delay “maiorzinho” da Atividade 01 (1.8s)
    setTimeout(() => this.router.navigateByUrl('/trilha'), 1800);
  }
}




