import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, race, timer } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Handles the redirect after email confirmation or Google OAuth.
 * Supabase exchanges the code in the URL for a session; once the user
 * is signed in we refresh /auth/me and route to the right place.
 */
@Component({
  standalone: true,
  selector: 'app-auth-callback',
  template: `
    <div class="flex h-screen items-center justify-center bg-slate-900">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-400 text-sm">Autenticando…</p>
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit() {
    // If the user is already signed in (e.g. bookmarked this URL), proceed immediately.
    if (this.auth.getAccessToken()) {
      void this.proceed();
      return;
    }

    // Otherwise wait for Supabase to finish the PKCE / OAuth code exchange
    // and fire SIGNED_IN via onAuthStateChange → user$ emits a non-null user.
    // Race against a 15-second timeout to avoid hanging on bad/expired links.
    race(
      this.auth.user$.pipe(
        filter(user => !!user),
        take(1),
        map(() => true),
      ),
      timer(15_000).pipe(map(() => false)),
    ).pipe(take(1)).subscribe(signedIn => {
      if (signedIn) {
        void this.proceed();
      } else {
        void this.router.navigate(['/login']);
      }
    });
  }

  private async proceed() {
    const me = await this.auth.refreshMe();
    if (me?.tenantId) {
      void this.router.navigate(['/app/dashboard']);
    } else if (this.auth.getAccessToken()) {
      void this.router.navigate(['/cadastro/empresa']);
    } else {
      void this.router.navigate(['/login']);
    }
  }
}
