import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  private _user$    = new BehaviorSubject<User | null>(null);
  private _session$ = new BehaviorSubject<Session | null>(null);
  private _ready$   = new BehaviorSubject<boolean>(false);

  readonly user$:         Observable<User | null> = this._user$.asObservable();
  readonly isLoggedIn$  = this.user$.pipe(map(u => !!u));
  readonly sessionReady$: Observable<boolean>     = this._ready$.asObservable();

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
    });

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
      this._ready$.next(true);
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }

  getAccessToken(): string | null {
    return this._session$.getValue()?.access_token ?? null;
  }

  createTenant(dto: { companyName: string; segment?: string; cnpj?: string; phone?: string }) {
    return firstValueFrom(
      this.http.post<{ tenantId: string; trialEndsAt: string }>(
        `${environment.apiUrl}/auth/onboarding`,
        dto,
      ),
    );
  }
}
