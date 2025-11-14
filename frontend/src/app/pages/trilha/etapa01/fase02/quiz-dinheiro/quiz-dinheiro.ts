import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../core/trilha.service';

type Choice = 'V' | 'F' | null;

interface QuizQuestion {
  id: number;
  text: string;
  answer: Exclude<Choice, null>; // 'V' | 'F'
  user: Choice;
  explanation: string;
}

@Component({
  selector: 'app-quiz-dinheiro',
  standalone: true,
  templateUrl: './quiz-dinheiro.html',
  styleUrls: ['./quiz-dinheiro.scss']
})
export class QuizDinheiroComponent {

  // Dicas no topo
  tips = [
    { icon:'💡', text:'Responda V (verdadeiro) ou F (falso) para cada afirmação.' },
    { icon:'🎯', text:'Para concluir, todas as respostas precisam estar corretas.' },
  ];

  // Perguntas + explicações
  private _questions = signal<QuizQuestion[]>([
    {
      id: 1,
      text: 'Pagar só o mínimo do cartão é uma boa estratégia para economizar.',
      answer: 'F',
      user: null,
      explanation: 'Pagar só o mínimo faz o restante virar dívida com juros altos. Isso geralmente aumenta o valor total da fatura.'
    },
    {
      id: 2,
      text: 'Guardar um pouco todo mês ajuda a formar reserva de emergência.',
      answer: 'V',
      user: null,
      explanation: 'A reserva de emergência nasce justamente do hábito de guardar um pouco sempre, mesmo que seja um valor pequeno.'
    },
    {
      id: 3,
      text: 'Anotar pequenos gastos pode revelar desperdícios no mês.',
      answer: 'V',
      user: null,
      explanation: 'Os “gastos formiguinha” (pequenos, mas frequentes) costumam passar despercebidos, mas somados fazem diferença no orçamento.'
    },
    {
      id: 4,
      text: 'Parcelar sem juros é sempre melhor do que pagar à vista.',
      answer: 'F',
      user: null,
      explanation: 'Mesmo sem juros, parcelar pode comprometer sua renda futura. Muitas vezes, pagar à vista evita excesso de parcelas acumuladas.'
    },
    {
      id: 5,
      text: 'Ter um orçamento mensal reduz “apertos” no fim do mês.',
      answer: 'V',
      user: null,
      explanation: 'Quando você planeja quanto pode gastar em cada categoria, evita surpresas e apertos no fim do mês.'
    },
  ]);

  questions = this._questions.asReadonly();

  // Flag para saber se o aluno já clicou em "Concluir"
  trilhaSubmit = false;

  constructor(
    private router: Router,
    private progress: TrilhaProgressService
  ) {}

  // ======= LÓGICA DO QUIZ =======

  mark(choice: Choice, idx: number) {
    this._questions.update(arr => {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], user: choice };
      return copy;
    });
    // sempre que marcar, não mostramos feedback geral ainda
    // (ele só aparece depois do clique em Concluir)
  }

  allAnswered(): boolean {
    return this._questions().every(q => q.user !== null);
  }

  private allCorrect(): boolean {
    return this._questions().every(q => q.user === q.answer);
  }

  correctCount(): number {
    return this._questions().filter(q => q.user === q.answer).length;
  }

  // feedback geral (alerta verde/vermelho)
  showFeedback(): 'erro' | 'ok' | null {
    if (!this.trilhaSubmit) return null;

    if (!this.allAnswered()) {
      return 'erro'; // ainda tem pergunta sem marcar
    }

    return this.allCorrect() ? 'ok' : 'erro';
  }

  // a pergunta está correta?
  isQuestionCorrect(q: QuizQuestion): boolean {
    return q.user !== null && q.user === q.answer;
  }

  // mostrar pill + explicação?
  // regra: só depois de clicar em CONCLUIR e se a pergunta estiver errada
  shouldShowStatus(q: QuizQuestion): boolean {
    if (!this.trilhaSubmit) return false; // ainda não clicou em Concluir
    if (q.user === null) return false;    // não respondeu
    return q.user !== q.answer;          // só se estiver errada
  }

  // ======= AÇÃO "CONCLUIR" =======
  concluir() {
    this.trilhaSubmit = true; // marcou tentativa de envio

    if (!this.allAnswered()) {
      // faltam respostas → mostra alerta de erro, mas NÃO volta pra trilha
      return;
    }

    if (!this.allCorrect()) {
      // tem erro → mostra feedback por pergunta + alerta vermelho
      return;
    }

    // tudo correto → marca atividade como concluída na trilha
    this.progress.completeById('sec1-n2');

    // feedback verde + volta pra trilha depois de um tempinho
    setTimeout(() => {
      this.router.navigate(['/trilha']);
    }, 1800);
  }

    // Botão voltar para a página Trilha
  submitting = signal(false);

  voltar() {
    if (this.submitting()) return;
    this.router.navigate(['/trilha']);
  }
}
