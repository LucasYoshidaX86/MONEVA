import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserProfileService } from './user-profile.service';

export const skipOnboardingGuard: CanActivateFn = async () => {
  const profileSvc = inject(UserProfileService);
  const router = inject(Router);

  try {
    const profile = await profileSvc.getProfile();
    if (profile?.completedOnboarding) {
      await router.navigateByUrl('/home');
      return false;
    }
    return true;
  } catch {
    return true; // em dúvida, deixa passar para o onboarding
  }
};
