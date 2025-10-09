import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="container py-5 text-center text-light">
      <h2>Bem-vindo ao Moneva 👋</h2>
      <p>Login realizado com sucesso.</p>
      <a routerLink="/" class="btn btn-outline-light mt-3">Sair</a>
    </div>
  `
})
export class DashboardComponent {}
