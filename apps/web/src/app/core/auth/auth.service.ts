import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  private _user$ = new BehaviorSubject<User | null>(null);
  private _session$ = new BehaviorSubject<Session | null>(null);

  readonly user$: Observable<User | null> = this._user$.asObservable();
  readonly isLoggedIn$ = this.user$.pipe(map(u => !!u));

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
    });

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._user$.next(session?.user ?? null);
      this._session$.next(session);
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }

  getAccessToken(): string | null {
    return this._session$.getValue()?.access_token ?? null;
  }
}
