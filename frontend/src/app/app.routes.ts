import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { onboardingGuard } from './core/onboarding.guard';
import { skipOnboardingGuard } from './core/skip-onboarding.guard';

import { LoginComponent } from './pages/login/login';
import { Home } from './pages/home/home';
import { Trilha } from './pages/trilha/trilha';
import { SaibaMais } from './pages/saiba-mais/saiba-mais';
import { OnboardingComponent } from './pages/onboarding/onboarding'; // 👈 corrige o import
import { Demonstrativos } from './pages/demonstrativos/demonstrativos';
import { Conquistas } from './pages/conquistas/conquistas';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  // Onboarding obrigatório logo após login/cadastro
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard, skipOnboardingGuard] },

  { path: 'onboarding-dev', component: OnboardingComponent },

  // Home e Trilha só depois de concluir o onboarding
  { path: 'home', component: Home, canActivate: [authGuard, onboardingGuard] },
  { path: 'trilha', component: Trilha, canActivate: [authGuard, onboardingGuard] },
  { path: 'demonstrativos', component: Demonstrativos, canActivate: [authGuard, onboardingGuard] },
  { path: 'conquistas', component: Conquistas, canActivate: [authGuard, onboardingGuard] },

  // Público (se quiser pode proteger)
  { path: 'saiba-mais', component: SaibaMais },

  { path: '**', redirectTo: 'login' }
];
