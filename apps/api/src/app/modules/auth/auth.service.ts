import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SettingsService } from '../settings/settings.service';

export interface OnboardingDto {
  companyName: string;
  segment?: 'electronics' | 'hvac' | 'it' | 'automotive' | 'generic';
  cnpj?: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
  ) {}

  async onboarding(userId: string, dto: OnboardingDto) {
    // Ensure user doesn't already have a tenant
    const existing = await this.dataSource.query<{ tenant_id: string }[]>(
      `SELECT tenant_id FROM public.tenant_users WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    if (existing.length) {
      throw new ConflictException('Usuário já possui uma empresa cadastrada');
    }

    const slug = this.generateSlug(dto.companyName);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [tenant] = await this.dataSource.query<{ id: string }[]>(
      `INSERT INTO public.tenants (name, slug, cnpj, phone, segment, plan, trial_ends_at)
       VALUES ($1, $2, $3, $4, $5, 'trial', $6) RETURNING id`,
      [
        dto.companyName,
        slug,
        dto.cnpj ?? null,
        dto.phone ?? null,
        dto.segment ?? 'generic',
        trialEndsAt,
      ],
    );

    await this.dataSource.query(
      `INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES ($1, $2, 'TENANT_ADMIN')`,
      [tenant.id, userId],
    );

    await this.settingsService.seedDefaults(tenant.id);

    return { tenantId: tenant.id, trialEndsAt };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base}-${Date.now().toString(36)}`;
  }
}
