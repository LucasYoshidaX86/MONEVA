import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, ValidationErrors, AbstractControl, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserProfileService } from '../../core/user-profile.service';

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
  private userProfile = inject(UserProfileService);

  mode: 'login' | 'register' = 'login';
  loading = false;
  errorMsg = '';

  showLoginPass = false;
  showRegPass = false;
  showRegPass2 = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [true]
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  }, { validators: this.passwordsMatch('password', 'confirmPassword') });

  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls as any; }

  switch(m:'login'|'register'){ this.mode = m; this.errorMsg = ''; }

  private async redirectAfterAuth() {
    const profile = await this.userProfile.getProfile();
    if (!profile || !profile.completedOnboarding) {
      await this.router.navigateByUrl('/onboarding');
    } else {
      await this.router.navigateByUrl('/home');
    }
  }

  async submitLogin() {
    this.errorMsg = '';
    if (this.loginForm.invalid) return;
    this.loading = true;
    // dentro do submitLogin e submitRegister
    try {
      const profile = await this.userProfile.getProfile();
      if (!profile || !profile.completedOnboarding) {
        this.router.navigateByUrl('/onboarding');
      } else {
        this.router.navigateByUrl('/home');
      }
    } catch (err) {
      console.warn('Falha ao ler perfil, seguindo para onboarding por segurança.', err);
      // Não trave o login: encaminhe para onboarding
      this.router.navigateByUrl('/onboarding');
    }
  }

  async submitRegister() {
    this.errorMsg = '';
    if (this.registerForm.invalid || this.registerForm.errors?.['passwordMismatch']) return;
    this.loading = true;
    // dentro do submitLogin e submitRegister
    try {
      const profile = await this.userProfile.getProfile();
      if (!profile || !profile.completedOnboarding) {
        this.router.navigateByUrl('/onboarding');
      } else {
        this.router.navigateByUrl('/home');
      }
    } catch (err) {
      console.warn('Falha ao ler perfil, seguindo para onboarding por segurança.', err);
      // Não trave o login: encaminhe para onboarding
      this.router.navigateByUrl('/onboarding');
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

  private passwordsMatch(pwdKey: string, confirmKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const g = group as FormGroup;
      const pwd = g.get(pwdKey)?.value;
      const cfm = g.get(confirmKey)?.value;
      if (!pwd || !cfm) return null;
      return pwd === cfm ? null : { passwordMismatch: true };
    };
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
