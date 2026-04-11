import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex h-screen bg-gray-100 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div class="flex items-center gap-2 px-4 h-16 border-b border-gray-700">
          <div class="w-7 h-7 rounded bg-red-500 flex items-center justify-center text-xs font-bold shrink-0">S</div>
          <span class="font-semibold text-sm">Nexus Admin</span>
        </div>
        <nav class="flex-1 py-3 px-2 space-y-0.5">
          <a routerLink="/admin"
            routerLinkActive="bg-gray-700 text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-2 px-3 py-2 rounded text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors">
            <i class="pi pi-home text-sm w-4 text-center"></i>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/tenants"
            routerLinkActive="bg-gray-700 text-white"
            class="flex items-center gap-2 px-3 py-2 rounded text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors">
            <i class="pi pi-building text-sm w-4 text-center"></i>
            <span>Tenants</span>
          </a>
        </nav>
        <div class="border-t border-gray-700 p-3 flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-400 truncate">{{ userEmail }}</p>
          </div>
          <button (click)="logout()" class="p-1 text-gray-400 hover:text-red-400 transition-colors" aria-label="Sair">
            <i class="pi pi-sign-out text-sm"></i>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <span class="text-sm font-medium text-gray-500">Super Admin</span>
        </header>
        <main class="flex-1 overflow-y-auto">
          <div class="mx-auto w-full max-w-7xl px-6 py-6">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly user = toSignal(this.auth.user$);

  get userEmail()   { return this.user()?.email ?? ''; }
  get userInitial() { return this.userEmail.charAt(0).toUpperCase() || 'S'; }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
