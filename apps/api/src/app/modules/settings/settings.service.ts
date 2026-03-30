import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DataSource } from 'typeorm';
import { CustomStatusEntity } from './entities/custom-status.entity';
import { TenantSettingsEntity } from './entities/tenant-settings.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { PermissionEntity } from './entities/permission.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(CustomStatusEntity)
    private readonly statuses: Repository<CustomStatusEntity>,
    @InjectRepository(TenantSettingsEntity)
    private readonly settings: Repository<TenantSettingsEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissions: Repository<PermissionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Custom Statuses ───────────────────────────────────────

  findStatuses(tenantId: string, entityType?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (entityType) where.entityType = entityType;
    return this.statuses.find({ where, order: { entityType: 'ASC', sortOrder: 'ASC' } });
  }

  async createStatus(tenantId: string, dto: Partial<CustomStatusEntity>) {
    return this.statuses.save({ ...dto, tenantId });
  }

  async updateStatus(tenantId: string, id: string, dto: Partial<CustomStatusEntity>) {
    const status = await this.statuses.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
    });
    if (!status) throw new NotFoundException(`Status ${id} não encontrado`);
    await this.statuses.update({ id, tenantId }, dto);
    return this.statuses.findOne({ where: { id } });
  }

  async deleteStatus(tenantId: string, id: string) {
    const status = await this.statuses.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
    });
    if (!status) throw new NotFoundException(`Status ${id} não encontrado`);
    if (status.isSystem) throw new BadRequestException('Status de sistema não pode ser removido');
    await this.statuses.softDelete({ id, tenantId });
  }

  async reorderStatuses(tenantId: string, items: { id: string; sortOrder: number }[]) {
    for (const item of items) {
      await this.statuses.update({ id: item.id, tenantId }, { sortOrder: item.sortOrder });
    }
    return this.findStatuses(tenantId);
  }

  // ── Tenant Settings ───────────────────────────────────────

  async getSettings(tenantId: string) {
    let settings = await this.settings.findOne({ where: { tenantId } });
    if (!settings) {
      settings = await this.settings.save({ tenantId });
    }
    return settings;
  }

  async updateSettings(tenantId: string, dto: Partial<TenantSettingsEntity>) {
    let settings = await this.settings.findOne({ where: { tenantId } });
    if (!settings) {
      settings = await this.settings.save({ ...dto, tenantId });
    } else {
      await this.settings.update({ tenantId }, dto);
      settings = await this.settings.findOne({ where: { tenantId } });
    }
    return settings;
  }

  // ── Permissions ───────────────────────────────────────────

  findPermissions(tenantId: string) {
    return this.permissions.find({ where: { tenantId }, order: { role: 'ASC', module: 'ASC' } });
  }

  async upsertPermissions(tenantId: string, perms: { role: string; module: string; actions: string[] }[]) {
    for (const p of perms) {
      const existing = await this.permissions.findOne({
        where: { tenantId, role: p.role, module: p.module },
      });
      if (existing) {
        await this.permissions.update({ id: existing.id }, { actions: p.actions });
      } else {
        await this.permissions.save({ tenantId, role: p.role, module: p.module, actions: p.actions });
      }
    }
    return this.findPermissions(tenantId);
  }

  // ── Audit Logs ────────────────────────────────────────────

  findAuditLogs(tenantId: string, filters?: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.auditLogs.createQueryBuilder('log')
      .where('log.tenant_id = :tenantId', { tenantId })
      .orderBy('log.created_at', 'DESC');

    if (filters?.userId) qb.andWhere('log.user_id = :userId', { userId: filters.userId });
    if (filters?.entity) qb.andWhere('log.entity = :entity', { entity: filters.entity });
    if (filters?.entityId) qb.andWhere('log.entity_id = :entityId', { entityId: filters.entityId });
    if (filters?.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters?.from) qb.andWhere('log.created_at >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.created_at <= :to', { to: filters.to });

    qb.take(filters?.limit || 50);
    qb.skip(filters?.offset || 0);

    return qb.getManyAndCount().then(([data, total]) => ({ data, total }));
  }

  // ── Seed default statuses for a new tenant ────────────────

  async seedDefaults(tenantId: string) {
    const soStatuses = [
      { name: 'Aberta', color: '#3B82F6', sortOrder: 0, isDefault: true, isFinal: false, isSystem: true },
      { name: 'Em andamento', color: '#F59E0B', sortOrder: 1, isDefault: false, isFinal: false, isSystem: true },
      { name: 'Aguardando peça', color: '#8B5CF6', sortOrder: 2, isDefault: false, isFinal: false, isSystem: true },
      { name: 'Concluída', color: '#10B981', sortOrder: 3, isDefault: false, isFinal: true, isSystem: true },
      { name: 'Cancelada', color: '#EF4444', sortOrder: 4, isDefault: false, isFinal: true, isSystem: true },
    ];
    const quoteStatuses = [
      { name: 'Rascunho', color: '#6B7280', sortOrder: 0, isDefault: true, isFinal: false, isSystem: true },
      { name: 'Enviado', color: '#3B82F6', sortOrder: 1, isDefault: false, isFinal: false, isSystem: true },
      { name: 'Aprovado', color: '#10B981', sortOrder: 2, isDefault: false, isFinal: true, isSystem: true },
      { name: 'Rejeitado', color: '#EF4444', sortOrder: 3, isDefault: false, isFinal: true, isSystem: true },
      { name: 'Expirado', color: '#9CA3AF', sortOrder: 4, isDefault: false, isFinal: true, isSystem: true },
    ];
    const saleStatuses = [
      { name: 'Aberta', color: '#3B82F6', sortOrder: 0, isDefault: true, isFinal: false, isSystem: true },
      { name: 'Paga', color: '#10B981', sortOrder: 1, isDefault: false, isFinal: true, isSystem: true },
      { name: 'Cancelada', color: '#EF4444', sortOrder: 2, isDefault: false, isFinal: true, isSystem: true },
    ];

    for (const s of soStatuses) {
      await this.statuses.save({ ...s, tenantId, entityType: 'service_order' as const });
    }
    for (const s of quoteStatuses) {
      await this.statuses.save({ ...s, tenantId, entityType: 'quote' as const });
    }
    for (const s of saleStatuses) {
      await this.statuses.save({ ...s, tenantId, entityType: 'sale' as const });
    }

    // Seed default permissions
    const defaultPerms = [
      { role: 'TECNICO', module: 'clients', actions: ['create', 'read', 'update'] },
      { role: 'TECNICO', module: 'service_orders', actions: ['create', 'read', 'update', 'delete'] },
      { role: 'TECNICO', module: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
      { role: 'TECNICO', module: 'equipments', actions: ['create', 'read', 'update'] },
      { role: 'TECNICO', module: 'products', actions: ['read'] },
      { role: 'TECNICO', module: 'services_catalog', actions: ['read'] },
      { role: 'TECNICO', module: 'inventory', actions: ['read'] },
      { role: 'VENDEDOR', module: 'clients', actions: ['read'] },
      { role: 'VENDEDOR', module: 'sales', actions: ['create', 'read', 'update', 'cancel'] },
      { role: 'VENDEDOR', module: 'returns', actions: ['create', 'read'] },
      { role: 'VENDEDOR', module: 'cash_register', actions: ['open', 'close', 'read', 'withdraw'] },
      { role: 'VENDEDOR', module: 'products', actions: ['read'] },
      { role: 'VENDEDOR', module: 'services_catalog', actions: ['read'] },
      { role: 'VENDEDOR', module: 'inventory', actions: ['read'] },
    ];
    for (const p of defaultPerms) {
      await this.permissions.save({ ...p, tenantId });
    }

    // Seed tenant settings
    await this.settings.save({ tenantId });
  }
}
