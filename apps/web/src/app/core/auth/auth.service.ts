import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TenantInfo {
  name: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  logoUrl: string | null;
  trialEndsAt: string | null;
}

export interface MeResponse {
  userId: string;
  tenantId: string | null;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TECNICO' | 'VENDEDOR' | null;
  tenant: TenantInfo | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  private _user$     = new BehaviorSubject<User | null>(null);
  private _session$  = new BehaviorSubject<Session | null>(null);
  private _ready$    = new BehaviorSubject<boolean>(false);
  private _meLoaded$ = new BehaviorSubject<boolean>(false);

  readonly user$:         Observable<User | null>    = this._user$.asObservable();
  readonly isLoggedIn$  = this.user$.pipe(map(u => !!u));
  readonly sessionReady$: Observable<boolean>         = this._ready$.asObservable();
  readonly meLoaded$:     Observable<boolean>         = this._meLoaded$.asObservable();

  readonly userRole   = signal<MeResponse['role']>(null);
  readonly userTenant = signal<string | null>(null);

  constructor() {
    // Primary source of truth: onAuthStateChange fires INITIAL_SESSION on load,
    // SIGNED_IN after OAuth/email-confirmation code exchange, SIGNED_OUT on logout.
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
      this._ready$.next(true);

      if (session) {
        this._meLoaded$.next(false); // reset while we fetch the latest me
        void this.refreshMe();
      } else {
        this.userRole.set(null);
        this.userTenant.set(null);
        this._meLoaded$.next(true);
      }
    });

    // Belt-and-suspenders: ensures sessionReady fires even if onAuthStateChange is slow
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
      this._ready$.next(true);
      // refreshMe is handled by onAuthStateChange — don't call it here to avoid double requests
    });
  }

  async refreshMe(): Promise<MeResponse | null> {
    try {
      const me = await firstValueFrom(
        this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`),
      );
      this.userRole.set(me.role);
      this.userTenant.set(me.tenantId);
      this._meLoaded$.next(true);
      return me;
    } catch {
      this._meLoaded$.next(true);
      return null;
    }
  }

  isSuperAdmin() { return this.userRole() === 'SUPER_ADMIN'; }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      this._user$.next(data.session.user);
      this._session$.next(data.session);
      await this.refreshMe();
    }
    return data;
  }

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }

  getAccessToken(): string | null {
    return this._session$.getValue()?.access_token ?? null;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw error;
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
