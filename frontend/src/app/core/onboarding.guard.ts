import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserProfileService } from './user-profile.service';

export const onboardingGuard: CanActivateFn = async () => {
  const profileSvc = inject(UserProfileService);
  const router = inject(Router);

  try {
    const profile = await profileSvc.getProfile();
    if (!profile || !profile.completedOnboarding) {
      await router.navigateByUrl('/onboarding');
      return false;
    }
    return true;
  } catch {
    await router.navigateByUrl('/');
    return false;
  }
};
