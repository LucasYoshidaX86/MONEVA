import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../trilha/trilha-progress';

type Choice = 'V' | 'F' | null;
type Key = Exclude<Choice, null>;

@Component({
  selector: 'app-quiz-dinheiro',
  standalone: true,
  templateUrl: './quiz-dinheiro.html',
  styleUrls: ['./quiz-dinheiro.scss']
})
export class QuizDinheiroComponent {
  tips = [
    { icon:'💡', text:'Responda V (verdadeiro) ou F (falso) para cada afirmação.' },
    { icon:'🎯', text:'Para concluir, todas as respostas precisam estar corretas.' },
  ];

  questions = signal([
    { id: 1, text: 'Pagar só o mínimo do cartão é uma boa estratégia para economizar.', answer: 'F' as Key, user: null as Choice },
    { id: 2, text: 'Guardar um pouco todo mês ajuda a formar reserva de emergência.',   answer: 'V' as Key, user: null as Choice },
    { id: 3, text: 'Anotar pequenos gastos pode revelar desperdícios no mês.',          answer: 'V' as Key, user: null as Choice },
    { id: 4, text: 'Parcelar sem juros é sempre melhor do que pagar à vista.',          answer: 'F' as Key, user: null as Choice },
    { id: 5, text: 'Ter um orçamento mensal reduz “apertos” no fim do mês.',            answer: 'V' as Key, user: null as Choice },
  ]);

  showFeedback = signal<null | 'ok' | 'erro'>(null);
  reveal = signal(false);

  allAnswered = computed(() => this.questions().every(q => q.user !== null));
  allCorrect  = computed(() => this.questions().every(q => q.user === q.answer));
  correctCount = computed(() => this.questions().filter(q => q.user === q.answer).length);

  constructor(private router: Router, private progress: TrilhaProgressService) {}

  mark(choice: Choice, idx: number) {
    this.questions.update(arr => {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], user: choice };
      return copy;
    });
    this.showFeedback.set(null);
  }

  concluir() {
    if (!this.allAnswered()) { this.reveal.set(false); this.showFeedback.set('erro'); return; }
    if (!this.allCorrect())  { this.reveal.set(true);  this.showFeedback.set('erro'); return; }

    this.progress.completeById('sec1-n2');   // marca Atividade 02
    this.reveal.set(true);
    this.showFeedback.set('ok');
    setTimeout(() => this.router.navigateByUrl('/trilha'), 1600);
  }
}


