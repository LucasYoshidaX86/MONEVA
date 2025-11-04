import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../trilha/trilha-progress';

type Choice = 'V' | 'F' | null;

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
    { icon:'🎯', title:'Objetivo',     text:'Com metas claras, fica mais fácil manter o foco e motivação.' },
  ];

  // mini-quiz com SIGNAL (agora o computed reage às mudanças)
  questions = signal([
    { id: 1, text: 'Anotar gastos pequenos pode revelar desperdícios.', answer: 'V' as Exclude<Choice, null>, user: null as Choice },
    { id: 2, text: 'Planejar o mês ajuda a evitar dívidas.',            answer: 'V' as Exclude<Choice, null>, user: null as Choice },
    { id: 3, text: 'Cuidar do dinheiro é só pra quem ganha muito.',     answer: 'F' as Exclude<Choice, null>, user: null as Choice },
  ]);

  // estados de UI
  showFeedback = signal<null | 'ok' | 'erro'>(null);
  allAnswered = computed(() => this.questions().every(q => q.user !== null));
  allCorrect  = computed(() => this.questions().every(q => q.user === q.answer));

  constructor(private router: Router, private progress: TrilhaProgressService) {}

  mark(choice: Choice, index: number) {
    // atualiza imutavelmente para disparar o signal
    this.questions.update(arr => {
      const copy = [...arr];
      copy[index] = { ...copy[index], user: choice };
      return copy;
    });
    this.showFeedback.set(null);
  }

  concluir() {
  if (!this.allAnswered()) { 
    this.showFeedback.set('erro'); 
    return; 
  }

  if (!this.allCorrect())  { 
    this.showFeedback.set('erro'); 
    return; 
  }

  // Marca progresso e exibe feedback visual
  this.progress.completeById('sec1-n1');
  this.showFeedback.set('ok');

  // Atraso maior (1.8 segundos) antes de voltar pra trilha
  setTimeout(() => this.router.navigateByUrl('/trilha'), 1800);
}
}

