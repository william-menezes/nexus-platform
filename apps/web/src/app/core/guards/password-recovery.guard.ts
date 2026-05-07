import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export const passwordRecoveryGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Allow through immediately when the recovery hash is present in the URL —
  // Supabase will process the hash and fire PASSWORD_RECOVERY via onAuthStateChange.
  if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
    return true;
  }

  // For any other access (e.g. direct navigation to /redefinir-senha),
  // wait for session to settle then check whether recovery is active.
  return combineLatest([auth.sessionReady$, auth.meLoaded$]).pipe(
    filter(([ready, loaded]) => ready && loaded),
    take(1),
    map(() => auth.isRecoverySession() || router.createUrlTree(['/login'])),
  );
};

export const passwordRecoveryDeactivateGuard: CanDeactivateFn<unknown> = () => {
  // Block any navigation away from /redefinir-senha until the password is updated.
  // updatePassword() sets isRecoverySession to false before the router.navigate call,
  // so a successful reset navigates out while manual attempts are blocked.
  return !inject(AuthService).isRecoverySession();
};
