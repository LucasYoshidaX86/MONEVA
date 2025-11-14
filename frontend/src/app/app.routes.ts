import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { onboardingGuard } from './core/onboarding.guard';
import { skipOnboardingGuard } from './core/skip-onboarding.guard';


//Imports Relacionados ao Geral da Página
import { LoginComponent } from './pages/login/login';
import { Home } from './pages/home/home';
import { Trilha } from './pages/trilha/trilha';
import { SaibaMais } from './pages/saiba-mais/saiba-mais';
import { OnboardingComponent } from './pages/onboarding/onboarding'; // 👈 corrige o import
import { Demonstrativos } from './pages/demonstrativos/demonstrativos';
import { Conquistas } from './pages/conquistas/conquistas';


//Imports Relacionados a Trilha de Aprendizado
import { Introducao } from './pages/trilha/etapa01/fase01/introducao/introducao';
import { QuizDinheiroComponent } from './pages/trilha/etapa01/fase02/quiz-dinheiro/quiz-dinheiro';
import { EducacaoFinanceira } from './pages/trilha/etapa01/fase03/educacao-financeira/educacao-financeira';
import { Reserva } from './pages/trilha/etapa01/fase04/reserva/reserva';
import { PassosSimples } from './pages/trilha/etapa01/fase05/passos-simples/passos-simples';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  // Onboarding obrigatório logo após login/cadastro
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard, skipOnboardingGuard] },


  // Onboarding para Alterações Dev
  { path: 'onboarding-dev', component: OnboardingComponent },

  // Home e Trilha só depois de concluir o onboarding
  { path: 'home', component: Home, canActivate: [authGuard, onboardingGuard] },
  { path: 'trilha', component: Trilha, canActivate: [authGuard, onboardingGuard] },
  { path: 'demonstrativos', component: Demonstrativos, canActivate: [authGuard, onboardingGuard] },
  { path: 'conquistas', component: Conquistas, canActivate: [authGuard, onboardingGuard] },

  // Público (se quiser pode proteger)
  { path: 'saiba-mais', component: SaibaMais },


  // Relacionados a Trilha de Aprendizado
  { path: 'trilha/Introducao', component: Introducao, canActivate: [authGuard, onboardingGuard] },
  { path: 'trilha/quiz-dinheiro', component: QuizDinheiroComponent, canActivate: [authGuard, onboardingGuard]},
  { path: 'trilha/educacao-financeira', component: EducacaoFinanceira, canActivate: [authGuard, onboardingGuard] },
  { path: 'trilha/reserva', component: Reserva, canActivate: [authGuard, onboardingGuard] },
  {path:  'trilha/passos-simples', component: PassosSimples, canActivate: [authGuard, onboardingGuard] },







  { path: '**', redirectTo: 'login' }
];
