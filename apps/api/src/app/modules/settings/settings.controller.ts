import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  // ── Tenant Settings ───────────────────────────────────────

  @Get()
  @RequirePermission('settings:read')
  getSettings(@CurrentTenant() tenantId: string) {
    return this.svc.getSettings(tenantId);
  }

  @Patch()
  @RequirePermission('settings:update')
  updateSettings(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.svc.updateSettings(tenantId, dto);
  }

  // ── Custom Statuses ───────────────────────────────────────

  @Get('statuses')
  @RequirePermission('settings:read')
  findStatuses(
    @CurrentTenant() tenantId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.svc.findStatuses(tenantId, entityType);
  }

  @Post('statuses')
  @RequirePermission('settings:update')
  createStatus(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.svc.createStatus(tenantId, dto);
  }

  @Patch('statuses/:id')
  @RequirePermission('settings:update')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateStatus(tenantId, id, dto);
  }

  @Delete('statuses/:id')
  @RequirePermission('settings:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStatus(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.deleteStatus(tenantId, id);
  }

  @Patch('statuses/reorder')
  @RequirePermission('settings:update')
  reorderStatuses(
    @CurrentTenant() tenantId: string,
    @Body() items: { id: string; sortOrder: number }[],
  ) {
    return this.svc.reorderStatuses(tenantId, items);
  }

  // ── Permissions ───────────────────────────────────────────

  @Get('permissions')
  @RequirePermission('settings:read')
  findPermissions(@CurrentTenant() tenantId: string) {
    return this.svc.findPermissions(tenantId);
  }

  @Post('permissions')
  @RequirePermission('settings:update')
  upsertPermissions(
    @CurrentTenant() tenantId: string,
    @Body() perms: { role: string; module: string; actions: string[] }[],
  ) {
    return this.svc.upsertPermissions(tenantId, perms);
  }

  // ── Audit Logs ────────────────────────────────────────────

  @Get('audit-logs')
  @RequirePermission('audit_logs:read')
  findAuditLogs(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.findAuditLogs(tenantId, {
      userId, entity, entityId, action, from, to,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // ── Seed (para testes / onboarding) ───────────────────────

  @Post('seed-defaults')
  @RequirePermission('settings:update')
  seedDefaults(@CurrentTenant() tenantId: string) {
    return this.svc.seedDefaults(tenantId);
  }
}
