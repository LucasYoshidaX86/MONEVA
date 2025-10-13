import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

import { LoginComponent } from './pages/login/login';
import { Home } from './pages/home/home';
import { Trilha } from './pages/trilha/trilha';

export const routes: Routes = [
  { path: 'Login', component: LoginComponent },
  { path: 'Home', component: Home, canActivate: [authGuard] },
  { path: 'Trilha', component: Trilha, canActivate: [authGuard] },
  { path: '**', redirectTo: 'Login' }
];
