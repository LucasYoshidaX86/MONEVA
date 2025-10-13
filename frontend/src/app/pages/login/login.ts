import { Component, inject, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RouterLink } from "@angular/router";


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  mode: 'login' | 'register' = 'register';
  loading = false;
  errorMsg = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [true]
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }

  switch(m:'login'|'register'){ this.mode = m; this.errorMsg = ''; }

  async submitLogin() {
    this.errorMsg = '';
    if (this.loginForm.invalid) return;
    this.loading = true;
    try {
      const { email, password } = this.loginForm.value;
      await this.auth.login(email!, password!);
      this.router.navigateByUrl('/home');
    } catch (e:any) {
      console.error('Login error:', e);
      this.errorMsg = this.translateFirebaseError(e?.code);
    } finally {
      this.loading = false;
    }
  }

  async submitRegister() {
    this.errorMsg = '';
    if (this.registerForm.invalid) return;
    this.loading = true;
    try {
      const { name, email, password } = this.registerForm.value;
      await this.auth.register({ name: name!, email: email!, password: password! });
      this.router.navigateByUrl('/home');
    } catch (e:any) {
      console.error('Register error:', e);
      this.errorMsg = this.translateFirebaseError(e?.code);
    } finally {
      this.loading = false;
    }
  }

  async forgotPassword() {
    const email = this.loginForm.value.email;
    if (!email) { this.errorMsg = 'Informe seu e-mail para recuperar a senha.'; return; }
    try {
      await this.auth.resetPassword(email);
      this.errorMsg = 'Enviamos um link de recuperação para seu e-mail.';
    } catch (e:any) {
      console.error('Reset error:', e);
      this.errorMsg = this.translateFirebaseError(e?.code);
    }
  }

  private translateFirebaseError(code?: string): string {
    switch (code) {
      case 'auth/email-already-in-use':    return 'E-mail já cadastrado.';
      case 'auth/invalid-email':           return 'E-mail inválido.';
      case 'auth/weak-password':           return 'Senha fraca (mínimo de 6 caracteres).';
      case 'auth/operation-not-allowed':   return 'Método de login não habilitado (e-mail/senha).';
      case 'auth/network-request-failed':  return 'Falha de rede. Verifique sua conexão.';
      case 'auth/too-many-requests':       return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'auth/invalid-credential':      return 'Credenciais inválidas.';
      default: return code ? `Erro: ${code}` : 'Ocorreu um erro. Tente novamente.';
    }
  }
}