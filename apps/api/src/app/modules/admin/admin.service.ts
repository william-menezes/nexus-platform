import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class AdminService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async getMetrics() {
    const [[total], [active], [trial], [recent]] = await Promise.all([
      this.ds.query<{ count: string }[]>(`SELECT COUNT(*)::int AS count FROM public.tenants`),
      this.ds.query<{ count: string }[]>(`SELECT COUNT(*)::int AS count FROM public.tenants WHERE is_active = true`),
      this.ds.query<{ count: string }[]>(`SELECT COUNT(*)::int AS count FROM public.tenants WHERE plan = 'trial'`),
      this.ds.query<{ count: string }[]>(`SELECT COUNT(*)::int AS count FROM public.tenants WHERE created_at >= NOW() - INTERVAL '30 days'`),
    ]);
    return {
      totalTenants:  Number(total.count),
      activeTenants: Number(active.count),
      trialTenants:  Number(trial.count),
      recentSignups: Number(recent.count),
    };
  }

  findAllTenants(search?: string) {
    return this.ds.query<any[]>(
      `SELECT id, name, slug, plan, is_active, trial_ends_at, created_at, segment, cnpj, phone
       FROM public.tenants
       WHERE ($1 = '' OR name ILIKE '%' || $1 || '%')
       ORDER BY created_at DESC`,
      [search ?? ''],
    );
  }

  async findOneTenant(id: string) {
    const rows = await this.ds.query<any[]>(
      `SELECT t.id, t.name, t.slug, t.plan, t.is_active, t.trial_ends_at,
              t.created_at, t.segment, t.cnpj, t.phone,
              COUNT(tu.id)::int AS user_count
       FROM public.tenants t
       LEFT JOIN public.tenant_users tu ON tu.tenant_id = t.id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id],
    );
    return rows[0] ?? null;
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const sets: string[] = [];
    const params: any[] = [id];
    let i = 2;

    if (dto.plan !== undefined)        { sets.push(`plan = $${i++}`);         params.push(dto.plan); }
    if (dto.isActive !== undefined)    { sets.push(`is_active = $${i++}`);    params.push(dto.isActive); }
    if (dto.trialEndsAt !== undefined) { sets.push(`trial_ends_at = $${i++}`); params.push(dto.trialEndsAt); }

    if (sets.length === 0) return this.findOneTenant(id);

    await this.ds.query(
      `UPDATE public.tenants SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`,
      params,
    );
    return this.findOneTenant(id);
  }
}
