// src/app/pages/trilha/etapa01/fase05/passos-simples/passos-simples.ts
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrilhaProgressService } from '../../../../../core/trilha.service';

interface ActionStep {
  id: number;
  title: string;
  description: string;
  tag: string;
  selected: boolean;
}

@Component({
  selector: 'app-passos-simples',
  standalone: true,
  templateUrl: './passos-simples.html',
  styleUrl: './passos-simples.scss'
})
export class PassosSimples {

  constructor(
    private router: Router,
    private trilha: TrilhaProgressService
  ) {}

  // “cartõezinhos” de ação pra pessoa escolher
  steps = signal<ActionStep[]>([
    {
      id: 1,
      title: 'Anotar tudo por 7 dias',
      description: 'Registrar TUDO que gastar (até o cafezinho) durante uma semana.',
      tag: 'Consciência',
      selected: false
    },
    {
      id: 2,
      title: 'Definir 1 objetivo financeiro',
      description: 'Escolher algo simples: quitar uma dívida pequena, montar reserva, ou juntar para algo específico.',
      tag: 'Objetivo',
      selected: false
    },
    {
      id: 3,
      title: 'Escolher um dia de “revisão” na semana',
      description: 'Separar 15 min na semana para olhar o extrato e ver onde o dinheiro foi.',
      tag: 'Rotina',
      selected: false
    },
    {
      id: 4,
      title: 'Cortar 1 gasto que não faz tanta falta',
      description: 'Identificar um gasto recorrente que não é prioridade e reduzir ou eliminar.',
      tag: 'Economia',
      selected: false
    },
    {
      id: 5,
      title: 'Separar o dinheiro das contas logo que receber',
      description: 'Assim que receber, já reservar o valor das contas fixas do mês.',
      tag: 'Organização',
      selected: false
    },
  ]);

  // quantos passos a pessoa escolheu
  selectedCount = computed(
    () => this.steps().filter(s => s.selected).length
  );

  // botão Concluir só libera com 3 ou mais
  canConclude = computed(
    () => this.selectedCount() >= 3
  );

  feedback = signal<null | 'erro' | 'ok'>(null);
  submitting = signal(false);

  toggleStep(id: number) {
    this.steps.update(list =>
      list.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
    this.feedback.set(null);
  }

  async concluir() {
    if (!this.canConclude()) {
      this.feedback.set('erro');
      return;
    }

    if (this.submitting()) return;
    this.submitting.set(true);

    try {
      // Atividade 5 é um “lesson” → concluímos direto (100% XP dessa lição)
      await this.trilha.completeById('sec1-n5');
      this.feedback.set('ok');

      setTimeout(() => {
        this.router.navigate(['/trilha']);
      }, 1200);
    } finally {
      this.submitting.set(false);
    }
  }

  voltar() {
    if (this.submitting()) return;
    this.router.navigate(['/trilha']);
  }
}
