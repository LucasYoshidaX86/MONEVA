import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

import { LoginComponent } from './pages/login/login';
import { Home } from './pages/home/home';
import { Trilha } from './pages/trilha/trilha';
import { SaibaMais } from './pages/saiba-mais/saiba-mais';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'trilha', component: Trilha, canActivate: [authGuard] },
  { path: 'saiba-mais', component: SaibaMais, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
