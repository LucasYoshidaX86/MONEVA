import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrilhaProgressService, TrilhaSection, NodeStatus } from '../../core/trilha.service';

// Declaração do componente Angular
@Component({
  selector: 'app-trilha',          // nome da tag usada no HTML
  standalone: true,               // indica que o componente é independente (não precisa de módulo)
  imports: [RouterLink],          // importa o RouterLink para usar no template
  templateUrl: './trilha.html',   // caminho do HTML do componente
  styleUrl: './trilha.scss'       // caminho do SCSS (estilos)
})
export class Trilha {

  // controla exibição do modal de reset
  showResetDialog = false;

  // Injeção do serviço que controla o progresso da trilha
  constructor(private progress: TrilhaProgressService) {}

  // ===== Controle do modal de confirmação =====

  // abre o modal
  openResetDialog() {
    this.showResetDialog = true;
  }

  // fecha o modal sem resetar
  closeResetDialog() {
    this.showResetDialog = false;
  }

  // confirma o reset (chamado pelo botão "Sim, resetar" no modal)
  confirmReset() {
  this.progress.reset(); 
  this.showResetDialog = false; // FECHA NA HORA
}


  // Getter usado para acessar as seções direto no HTML
  get sections(): TrilhaSection[] {
    return this.progress.sections;
  }

  // ===== Métodos usados no HTML =====

  // Zera todo o progresso da trilha (hoje só é chamado via confirmReset)
  resetProgress() {
    this.progress.reset();
  }

  // Conta quantas unidades (aulas/jogos) estão concluídas dentro da seção.
  doneCount(sec: TrilhaSection) {
    return this.progress.doneCount(sec);
  }

  // Calcula a porcentagem total de progresso de uma seção.
  sectionProgress(sec: TrilhaSection) {
    return this.progress.sectionProgress(sec);
  }

  // Retorna o status do nó (bloqueado, liberado ou concluído).
  getStatus(id: string): NodeStatus {
    return this.progress.getStatus(id);
  }

  // Retorna a porcentagem de progresso de um nó específico.
  progressOf(id: string): number {
    return this.progress.nodeProgress(id);
  }

  // Verifica se o nó atual é o que o usuário deve começar (exibe o selo “COMEÇAR”).
  isCurrent(sec: TrilhaSection, index: number): boolean {
    return this.progress.isCurrent(sec, index);
  }

  // Gera a rota do nó para navegação no Angular Router.
  routeFor(id: string): string {
    return this.progress.routeFor(id);
  }

  // Exibe XP total na topbar
  totalXp(): number {
    return this.progress.totalXp();
  }
}
