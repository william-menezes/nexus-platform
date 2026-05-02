import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ExtendTrialDto } from './dto/extend-trial.dto';

@Injectable()
export class AdminService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ----------------------------------------------------------------
  // Metrics
  // ----------------------------------------------------------------

  async getMetrics() {
    const [[total], [active], [trial], [recent], [paying], [mrrRow]] =
      await Promise.all([
        this.ds.query<{ count: string }[]>(
          `SELECT COUNT(*)::int AS count FROM public.tenants`,
        ),
        this.ds.query<{ count: string }[]>(
          `SELECT COUNT(*)::int AS count FROM public.tenants WHERE is_active = true`,
        ),
        this.ds.query<{ count: string }[]>(
          `SELECT COUNT(*)::int AS count FROM public.tenants WHERE plan = 'trial'`,
        ),
        this.ds.query<{ count: string }[]>(
          `SELECT COUNT(*)::int AS count FROM public.tenants WHERE created_at >= NOW() - INTERVAL '30 days'`,
        ),
        this.ds.query<{ count: string }[]>(
          `SELECT COUNT(DISTINCT t.id)::int AS count
           FROM public.tenants t
           INNER JOIN public.subscriptions s ON s.tenant_id = t.id
           WHERE t.plan != 'trial' AND s.status = 'active'`,
        ),
        this.ds.query<{ mrr: string }[]>(
          `SELECT COALESCE(SUM(p.price), 0)::numeric AS mrr
           FROM public.tenants t
           INNER JOIN public.subscriptions s ON s.tenant_id = t.id
           INNER JOIN public.plans p ON p.slug = t.plan
           WHERE s.status = 'active'`,
        ),
      ]);

    return {
      totalTenants:   Number(total.count),
      activeTenants:  Number(active.count),
      trialTenants:   Number(trial.count),
      recentSignups:  Number(recent.count),
      payingTenants:  Number(paying.count),
      mrr:            Number(mrrRow.mrr),
    };
  }

  // ----------------------------------------------------------------
  // Tenants
  // ----------------------------------------------------------------

  findAllTenants(search?: string, plan?: string, status?: 'active' | 'inactive') {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (search) {
      conditions.push(`(t.name ILIKE '%' || $${i} || '%' OR t.slug ILIKE '%' || $${i} || '%')`);
      params.push(search);
      i++;
    }

    if (plan) {
      conditions.push(`t.plan = $${i++}`);
      params.push(plan);
    }

    if (status === 'active') {
      conditions.push(`t.is_active = true`);
    } else if (status === 'inactive') {
      conditions.push(`t.is_active = false`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return this.ds.query<any[]>(
      `SELECT t.id, t.name, t.slug, t.plan, t.is_active, t.trial_ends_at,
              t.created_at, t.segment, t.cnpj, t.phone
       FROM public.tenants t
       ${where}
       ORDER BY t.created_at DESC`,
      params,
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

    if (dto.plan !== undefined)        { sets.push(`plan = $${i++}`);          params.push(dto.plan); }
    if (dto.isActive !== undefined)    { sets.push(`is_active = $${i++}`);     params.push(dto.isActive); }
    if (dto.trialEndsAt !== undefined) { sets.push(`trial_ends_at = $${i++}`); params.push(dto.trialEndsAt); }

    if (sets.length === 0) return this.findOneTenant(id);

    await this.ds.query(
      `UPDATE public.tenants SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`,
      params,
    );
    return this.findOneTenant(id);
  }

  async extendTrial(id: string, dto: ExtendTrialDto) {
    await this.ds.query(
      `UPDATE public.tenants
       SET trial_ends_at = COALESCE(trial_ends_at, NOW()) + ($2 || ' days')::INTERVAL,
           updated_at = NOW()
       WHERE id = $1`,
      [id, dto.days],
    );
    return this.findOneTenant(id);
  }

  async revokeSubscription(id: string) {
    await this.ds.query(
      `UPDATE public.subscriptions
       SET status = 'cancelled', updated_at = NOW()
       WHERE tenant_id = $1`,
      [id],
    );
    return this.findOneTenant(id);
  }

  // ----------------------------------------------------------------
  // Plans
  // ----------------------------------------------------------------

  findAllPlans() {
    return this.ds.query<any[]>(
      `SELECT id, slug, name, description, price, modules, limits, is_active, sort_order, created_at, updated_at
       FROM public.plans
       ORDER BY sort_order ASC, created_at ASC`,
    );
  }

  async createPlan(dto: CreatePlanDto) {
    const rows = await this.ds.query<any[]>(
      `INSERT INTO public.plans (slug, name, description, price, modules, limits, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, true, $7)
       RETURNING *`,
      [
        dto.slug,
        dto.name,
        dto.description ?? null,
        dto.price,
        JSON.stringify(dto.modules),
        JSON.stringify(dto.limits),
        dto.sort_order ?? 0,
      ],
    );
    return rows[0];
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const sets: string[] = [];
    const params: any[] = [id];
    let i = 2;

    if (dto.slug !== undefined)        { sets.push(`slug = $${i++}`);        params.push(dto.slug); }
    if (dto.name !== undefined)        { sets.push(`name = $${i++}`);        params.push(dto.name); }
    if (dto.description !== undefined) { sets.push(`description = $${i++}`); params.push(dto.description); }
    if (dto.price !== undefined)       { sets.push(`price = $${i++}`);       params.push(dto.price); }
    if (dto.modules !== undefined)     { sets.push(`modules = $${i++}::jsonb`);  params.push(JSON.stringify(dto.modules)); }
    if (dto.limits !== undefined)      { sets.push(`limits = $${i++}::jsonb`);   params.push(JSON.stringify(dto.limits)); }
    if (dto.sort_order !== undefined)  { sets.push(`sort_order = $${i++}`);  params.push(dto.sort_order); }

    if (sets.length === 0) {
      const rows = await this.ds.query<any[]>(`SELECT * FROM public.plans WHERE id = $1`, [id]);
      return rows[0] ?? null;
    }

    const rows = await this.ds.query<any[]>(
      `UPDATE public.plans SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      params,
    );
    return rows[0] ?? null;
  }

  async deletePlan(id: string) {
    const [usage] = await this.ds.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM public.tenants WHERE plan = (SELECT slug FROM public.plans WHERE id = $1)`,
      [id],
    );

    if (Number(usage.count) > 0) {
      throw new BadRequestException(
        `Não é possível excluir: ${usage.count} tenant(s) utilizam este plano`,
      );
    }

    await this.ds.query(`DELETE FROM public.plans WHERE id = $1`, [id]);
    return { deleted: true };
  }

  // ----------------------------------------------------------------
  // Coupons
  // ----------------------------------------------------------------

  findAllCoupons() {
    return this.ds.query<any[]>(
      `SELECT id, code, type, value, valid_until, max_uses, uses_count, is_active, created_at, updated_at
       FROM public.coupons
       ORDER BY created_at DESC`,
    );
  }

  async createCoupon(dto: CreateCouponDto) {
    const rows = await this.ds.query<any[]>(
      `INSERT INTO public.coupons (code, type, value, valid_until, max_uses, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        dto.code,           // already lowercased by @Transform in DTO
        dto.type,
        dto.value,
        dto.valid_until ?? null,
        dto.max_uses ?? null,
        dto.is_active ?? true,
      ],
    );
    return rows[0];
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const sets: string[] = [];
    const params: any[] = [id];
    let i = 2;

    if (dto.code !== undefined)        { sets.push(`code = $${i++}`);        params.push(dto.code); }
    if (dto.type !== undefined)        { sets.push(`type = $${i++}`);        params.push(dto.type); }
    if (dto.value !== undefined)       { sets.push(`value = $${i++}`);       params.push(dto.value); }
    if (dto.valid_until !== undefined) { sets.push(`valid_until = $${i++}`); params.push(dto.valid_until); }
    if (dto.max_uses !== undefined)    { sets.push(`max_uses = $${i++}`);    params.push(dto.max_uses); }
    if (dto.is_active !== undefined)   { sets.push(`is_active = $${i++}`);   params.push(dto.is_active); }

    if (sets.length === 0) {
      const rows = await this.ds.query<any[]>(`SELECT * FROM public.coupons WHERE id = $1`, [id]);
      return rows[0] ?? null;
    }

    const rows = await this.ds.query<any[]>(
      `UPDATE public.coupons SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      params,
    );
    return rows[0] ?? null;
  }

  async deleteCoupon(id: string) {
    const result = await this.ds.query<any[]>(
      `DELETE FROM public.coupons WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result[0]) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return { deleted: true };
  }
}
