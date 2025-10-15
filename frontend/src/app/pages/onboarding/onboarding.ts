import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserProfileService, UserProfile } from '../../core/user-profile.service'; // ⬅ importe o tipo
import { Router } from '@angular/router';

type Gender = UserProfile['gender'];
type Status = UserProfile['currentStatus'];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss'
})
export class OnboardingComponent {
  private fb = inject(FormBuilder);
  private profileSvc = inject(UserProfileService);
  private router = inject(Router);

  step = 1;
  loading = false;
  errorMsg = '';

  form = this.fb.group({
    gender: ['', Validators.required],            // string (pode vir '')
    monthlyIncome: [null, [Validators.required, Validators.min(0)]], // pode vir null
    lifeGoals: ['', [Validators.required, Validators.minLength(5)]],
    financialGoals: ['', [Validators.required, Validators.minLength(5)]],
    dreams: ['', [Validators.required, Validators.minLength(5)]],
    pains: ['', [Validators.required, Validators.minLength(5)]],
    currentStatus: ['', Validators.required]      // string (pode vir '')
  });

  async next() {
    const ok = this.validateCurrentStep();
    if (!ok) return;

    if (this.step < 4) { this.step++; return; }
    await this.finish();
  }

  prev() { if (this.step > 1) this.step--; }

  private validateCurrentStep(): boolean {
    const controlsByStep: Record<number, string[]> = {
      1: ['gender', 'monthlyIncome'],
      2: ['lifeGoals', 'financialGoals', 'dreams'],
      3: ['pains', 'currentStatus'],
      4: []
    };
    const keys = controlsByStep[this.step];
    keys.forEach(k => this.form.get(k)?.markAsTouched());
    return keys.every(k => this.form.get(k)?.valid);
  }

  /** 🔧 Converte null/'' para undefined e restringe os literais */
  private toProfilePayload(): Partial<UserProfile> {
    const v = this.form.getRawValue();

    const sanitize = (s?: string | null) =>
      (s && String(s).trim().length > 0) ? String(s).trim() : undefined;

    return {
      completedOnboarding: true,
      gender: sanitize(v.gender) as Gender | undefined,
      monthlyIncome: (v.monthlyIncome ?? undefined) as number | undefined,
      lifeGoals: sanitize(v.lifeGoals),
      financialGoals: sanitize(v.financialGoals),
      dreams: sanitize(v.dreams),
      pains: sanitize(v.pains),
      currentStatus: sanitize(v.currentStatus) as Status | undefined
    };
  }

  async finish() {
    if (this.form.invalid) return;
    this.loading = true; this.errorMsg = '';
    try {
      await this.profileSvc.upsertProfile(this.toProfilePayload());
      await this.router.navigateByUrl('/home');
    } catch (e:any) {
      console.error(e);
      this.errorMsg = 'Não foi possível salvar suas respostas. Tente novamente.';
    } finally {
      this.loading = false;
    }
  }
}
