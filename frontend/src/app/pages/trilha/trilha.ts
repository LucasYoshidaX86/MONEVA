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

  // Injeção do serviço que controla o progresso da trilha
  constructor(private progress: TrilhaProgressService) {}

  // Getter usado para acessar as seções direto no HTML
  // Isso evita erro de referência antes do construtor rodar
  get sections(): TrilhaSection[] {
    return this.progress.sections;
  }

  // ===== Métodos usados no HTML =====
  // Cada um desses apenas chama o método correspondente do service,
  // servindo como “ponte” entre o template e a lógica do serviço.

  // Zera todo o progresso da trilha.
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


  



