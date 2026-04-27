import { Injectable, computed, signal } from '@angular/core';
import { TenantInfo } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class TenantService {
  readonly tenant = signal<TenantInfo | null>(null);

  setFromMe(info: TenantInfo | null) {
    this.tenant.set(info);
  }

  readonly name    = computed(() => this.tenant()?.name ?? 'Nexus');
  readonly logoUrl = computed(() => this.tenant()?.logoUrl ?? null);
  readonly plan    = computed(() => this.tenant()?.plan ?? null);

  readonly trialEndsAt = computed(() => this.tenant()?.trialEndsAt ?? null);

  readonly trialDaysLeft = computed(() => {
    const ends = this.trialEndsAt();
    if (!ends) return null;
    const diff = new Date(ends).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  readonly planLabel = computed(() => {
    const labels: Record<string, string> = {
      trial: 'Trial', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
    };
    return labels[this.plan() ?? ''] ?? 'Trial';
  });
}
