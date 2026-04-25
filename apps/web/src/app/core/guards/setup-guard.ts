import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

/** Allows only authenticated users who have not yet created a tenant. */
export const setupGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return combineLatest([auth.sessionReady$, auth.meLoaded$]).pipe(
    filter(([sessionReady, meLoaded]) => sessionReady && meLoaded),
    take(1),
    map(() => {
      if (!auth.getAccessToken()) return router.createUrlTree(['/login']);
      if (auth.userTenant())      return router.createUrlTree(['/app/dashboard']);
      return true;
    }),
  );
};
