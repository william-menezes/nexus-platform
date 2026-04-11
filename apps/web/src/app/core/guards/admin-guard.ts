import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.sessionReady$.pipe(
    filter(ready => ready),
    take(1),
    map(() => {
      if (!auth.getAccessToken()) return router.createUrlTree(['/login']);
      if (auth.userRole() === 'SUPER_ADMIN') return true;
      return router.createUrlTree(['/app/dashboard']);
    }),
  );
};
