import { Component, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-demonstrativos',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './demonstrativos.html',
  styleUrl: './demonstrativos.scss',
})
export class Demonstrativos {
  saldoDisponivel = 1900;
  gastos = 600;
  categorias = [
    { nome: 'Alimentação', emoji: '🍔' },
    { nome: 'Transporte', emoji: '🚗' },
    { nome: 'Lazer', emoji: '🎮' },
    { nome: 'Moradia', emoji: '🏠' },
    { nome: 'Compras', emoji: '🛍️' },
    { nome: 'Educação', emoji: '🎓' },
  ];

  transacoes = [
    { tipo: 'entrada', categoria: 'Salário', valor: 2500 },
    { tipo: 'saida', categoria: 'Compras', valor: 350 },
    { tipo: 'saida', categoria: 'Transporte', valor: 150 },
  ];
}
