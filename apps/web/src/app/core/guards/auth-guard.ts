import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for session to be resolved (skip the initial null emission)
  return authService.sessionReady$.pipe(
    filter(ready => ready),
    take(1),
    map(() => {
      if (authService.getAccessToken()) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
