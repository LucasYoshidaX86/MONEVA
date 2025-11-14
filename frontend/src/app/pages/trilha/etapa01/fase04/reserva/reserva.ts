// src/app/pages/trilha/etapa01/fase04/desafio-erros-financeiros/desafio-erros-financeiros.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../core/trilha.service';

type OptionId = 'A' | 'B' | 'C' | 'D' | null;

interface ErrorOption {
  id: Exclude<OptionId, null>;
  text: string;
  isCorrect: boolean;
  explanation: string; // explicação do erro correto
}

interface ErrorQuestion {
  id: number;
  story: string;
  question: string;
  options: ErrorOption[];
  user: OptionId;
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  templateUrl: './reserva.html',
  styleUrl: './reserva.scss'
})
export class Reserva {

  constructor(
    private trilha: TrilhaProgressService,
    private router: Router
  ) {}

  // Blocos explicativos (cards) antes do jogo
  steps = [
    {
      icon: '🔍',
      title: 'Identificar armadilhas',
      text: 'Muitos erros parecem inofensivos no dia a dia, mas viram bola de neve no fim do mês.'
    },
    {
      icon: '🚫',
      title: 'Evitar hábitos ruins',
      text: 'Reconhecer comportamentos perigosos é o primeiro passo para mudar.'
    },
    {
      icon: '🔁',
      title: 'Criar novos hábitos',
      text: 'Trocar pequenos erros por escolhas melhores melhora muito sua vida financeira.'
    }
  ];

  // Perguntas do desafio
  private _questions = signal<ErrorQuestion[]>([
    {
      id: 1,
      story: 'João recebeu o salário na sexta-feira e decidiu comemorar. Saiu para bares todos os dias do fim de semana, comprou roupas novas parceladas em 8x no cartão e, quando chegou a segunda-feira, percebeu que não tinha separado dinheiro para pagar o aluguel.',
      question: 'Qual é o principal erro financeiro que João cometeu?',
      options: [
        {
          id: 'A',
          text: 'Usar o cartão de crédito para comprar roupas.',
          isCorrect: false,
          explanation: 'O problema não é só usar o cartão, e sim gastar sem planejamento com lazer e compras parceladas, esquecendo contas essenciais.'
        },
        {
          id: 'B',
          text: 'Não ter separado primeiro o dinheiro das contas fixas antes de gastar.',
          isCorrect: true,
          explanation: 'O maior erro foi não priorizar o aluguel e outras contas essenciais antes de gastar com lazer e compras parceladas.'
        },
        {
          id: 'C',
          text: 'Sair com os amigos no fim de semana.',
          isCorrect: false,
          explanation: 'Sair com amigos não é o erro em si, o problema é gastar mais do que pode e antes de pagar o que é prioridade.'
        },
        {
          id: 'D',
          text: 'Pagar o aluguel todo mês.',
          isCorrect: false,
          explanation: 'Pagar o aluguel é uma obrigação, não um erro. O erro foi justamente não reservar esse dinheiro.'
        }
      ],
      user: null
    },
    {
      id: 2,
      story: 'Ana tem um cartão de crédito com limite de R$ 2.000. Todo mês, ela gasta quase o limite inteiro e paga apenas o valor mínimo da fatura, acreditando que assim “não fica devendo” ao banco.',
      question: 'Qual é o erro financeiro que a Ana está cometendo?',
      options: [
        {
          id: 'A',
          text: 'Usar cartão de crédito para compras do dia a dia.',
          isCorrect: false,
          explanation: 'O maior problema aqui não é o uso do cartão, mas o jeito que ela está pagando a fatura.'
        },
        {
          id: 'B',
          text: 'Pagar apenas o valor mínimo da fatura todo mês.',
          isCorrect: true,
          explanation: 'Pagar apenas o mínimo faz a dívida crescer com juros muito altos, virando uma bola de neve.'
        },
        {
          id: 'C',
          text: 'Ter um limite de R$ 2.000 no cartão.',
          isCorrect: false,
          explanation: 'Ter limite não é erro. O erro é usar quase tudo sem controle e não quitar o valor total.'
        },
        {
          id: 'D',
          text: 'Usar o cartão em compras parceladas sem juros.',
          isCorrect: false,
          explanation: 'Parcelar pode ser uma estratégia, desde que caiba no orçamento e não dependa do pagamento mínimo.'
        }
      ],
      user: null
    },
    {
      id: 3,
      story: 'Carlos decidiu “se organizar”. Ele assinou vários cursos online caros, uma academia premium e um pacote de TV por assinatura. Porém, quase não usa nada disso e vive reclamando que o dinheiro não sobra para montar uma reserva.',
      question: 'Qual é o principal erro financeiro do Carlos?',
      options: [
        {
          id: 'A',
          text: 'Não ganhar um salário maior.',
          isCorrect: false,
          explanation: 'O problema não é o salário em si, e sim as escolhas de gastos fixos que ele nem usa direito.'
        },
        {
          id: 'B',
          text: 'Ter despesas fixas altas com coisas que ele quase não utiliza.',
          isCorrect: true,
          explanation: 'O erro está em comprometer parte do orçamento com assinaturas e gastos recorrentes que não trazem benefício real.'
        },
        {
          id: 'C',
          text: 'Querer fazer cursos online.',
          isCorrect: false,
          explanation: 'Investir em conhecimento é ótimo, desde que caiba no orçamento e seja realmente utilizado.'
        },
        {
          id: 'D',
          text: 'Pensar em montar uma reserva financeira.',
          isCorrect: false,
          explanation: 'Querer ter reserva é algo positivo; o problema é não ajustar os gastos para isso acontecer.'
        }
      ],
      user: null
    }
  ]);

  questions = this._questions.asReadonly();

  // controla se o usuário já clicou em "Concluir"
  trilhaSubmit = false;

  // ===== LÓGICA =====

  selectOption(index: number, optionId: Exclude<OptionId, null>) {
    this._questions.update(list => {
      const clone = [...list];
      clone[index] = { ...clone[index], user: optionId };
      return clone;
    });
  }

  allAnswered(): boolean {
    return this._questions().every(q => q.user !== null);
  }

  private isQuestionCorrect(q: ErrorQuestion): boolean {
    if (!q.user) return false;
    const opt = q.options.find(o => o.id === q.user);
    return !!opt?.isCorrect;
  }

  private allCorrect(): boolean {
    return this._questions().every(q => this.isQuestionCorrect(q));
  }

  correctCount(): number {
    return this._questions().filter(q => this.isQuestionCorrect(q)).length;
  }

  // feedback geral (alerta embaixo)
  showFeedback(): 'erro' | 'ok' | null {
    if (!this.trilhaSubmit) return null;
    if (!this.allAnswered()) return 'erro';
    return this.allCorrect() ? 'ok' : 'erro';
  }

  // mostrar status/explicação dessa pergunta?
  // Só depois de clicar em CONCLUIR e se tiver errada
  shouldShowStatus(q: ErrorQuestion): boolean {
    if (!this.trilhaSubmit) return false;
    if (!q.user) return false;
    return !this.isQuestionCorrect(q);
  }

  correctOption(q: ErrorQuestion): ErrorOption | undefined {
    return q.options.find(o => o.isCorrect);
  }

  // ===== AÇÃO "CONCLUIR" =====

  async concluir() {
    this.trilhaSubmit = true;

    if (!this.allAnswered()) {
      // Só mostra alerta vermelho geral
      return;
    }

    const ok = this.allCorrect();
    if (!ok) {
      // mostra feedback por pergunta + alerta geral
      return;
    }

    // Tudo certo → marca atividade como concluída e libera a próxima
    this.trilha.completeById('sec1-n4');

    // Dá tempo de ver o feedback verde e volta pra trilha
    setTimeout(() => {
      this.router.navigate(['/trilha']);
    }, 1200);
  }

  voltar() {
    this.router.navigate(['/trilha']);
  }
}

