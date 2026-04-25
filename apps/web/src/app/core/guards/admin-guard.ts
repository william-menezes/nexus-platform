import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return combineLatest([auth.sessionReady$, auth.meLoaded$]).pipe(
    filter(([sessionReady, meLoaded]) => sessionReady && meLoaded),
    take(1),
    map(() => {
      if (!auth.getAccessToken())         return router.createUrlTree(['/login']);
      if (!auth.isSuperAdmin())           return router.createUrlTree(['/app/dashboard']);
      return true;
    }),
  );
};
