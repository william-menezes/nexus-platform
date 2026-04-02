import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import {
  CreateChartOfAccountDto,
  CreateCostCenterDto,
  CreateFinancialEntryDto,
  PayInstallmentDto,
  OpenCashSessionDto,
  CloseCashSessionDto,
  CreateCashMovementDto,
} from './dto/create-financial-entry.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant, CurrentUser } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly service: FinancialService) {}

  // ── Chart of Accounts ─────────────────────────────────────

  @Get('chart-of-accounts')
  @RequirePermission('financial:read')
  findAccounts(@CurrentTenant() tenantId: string) {
    return this.service.findAccounts(tenantId);
  }

  @Post('chart-of-accounts')
  @RequirePermission('financial:create')
  createAccount(@CurrentTenant() tenantId: string, @Body() dto: CreateChartOfAccountDto) {
    return this.service.createAccount(tenantId, dto);
  }

  @Delete('chart-of-accounts/:id')
  @RequirePermission('financial:delete')
  deleteAccount(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.deleteAccount(tenantId, id);
  }

  // ── Cost Centers ──────────────────────────────────────────

  @Get('cost-centers')
  @RequirePermission('financial:read')
  findCostCenters(@CurrentTenant() tenantId: string) {
    return this.service.findCostCenters(tenantId);
  }

  @Post('cost-centers')
  @RequirePermission('financial:create')
  createCostCenter(@CurrentTenant() tenantId: string, @Body() dto: CreateCostCenterDto) {
    return this.service.createCostCenter(tenantId, dto);
  }

  @Delete('cost-centers/:id')
  @RequirePermission('financial:delete')
  deleteCostCenter(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.deleteCostCenter(tenantId, id);
  }

  // ── Financial Entries ─────────────────────────────────────

  @Get('entries')
  @RequirePermission('financial:read')
  findEntries(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findEntries(tenantId, type, status, from, to);
  }

  @Get('entries/:id')
  @RequirePermission('financial:read')
  findOneEntry(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOneEntry(tenantId, id);
  }

  @Post('entries')
  @RequirePermission('financial:create')
  createEntry(@CurrentTenant() tenantId: string, @Body() dto: CreateFinancialEntryDto) {
    return this.service.createEntry(tenantId, dto);
  }

  @Delete('entries/:id')
  @RequirePermission('financial:delete')
  deleteEntry(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.deleteEntry(tenantId, id);
  }

  // ── Installments ──────────────────────────────────────────

  @Patch('installments/:id/pay')
  @RequirePermission('financial:update')
  payInstallment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.service.payInstallment(tenantId, id, dto);
  }

  // ── Cash Registers ────────────────────────────────────────

  @Get('cash-registers')
  @RequirePermission('cash_register:read')
  findRegisters(@CurrentTenant() tenantId: string) {
    return this.service.findRegisters(tenantId);
  }

  @Post('cash-registers')
  @RequirePermission('cash_register:open')
  createRegister(@CurrentTenant() tenantId: string, @Body('name') name: string) {
    return this.service.createRegister(tenantId, name);
  }

  // ── Cash Sessions ─────────────────────────────────────────

  @Get('cash-sessions/current')
  @RequirePermission('cash_register:read')
  getCurrentSession(@CurrentTenant() tenantId: string) {
    return this.service.getCurrentSession(tenantId);
  }

  @Get('cash-sessions/:id')
  @RequirePermission('cash_register:read')
  findSession(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findSession(tenantId, id);
  }

  @Post('cash-sessions/open')
  @RequirePermission('cash_register:open')
  openSession(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() dto: OpenCashSessionDto,
  ) {
    return this.service.openSession(tenantId, userId, dto);
  }

  @Post('cash-sessions/close')
  @RequirePermission('cash_register:close')
  closeSession(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() dto: CloseCashSessionDto,
  ) {
    return this.service.closeSession(tenantId, userId, dto);
  }

  // ── Cash Movements ────────────────────────────────────────

  @Post('cash-movements')
  @RequirePermission('cash_register:withdraw')
  createMovement(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() dto: CreateCashMovementDto,
  ) {
    return this.service.createMovement(tenantId, userId, dto);
  }
}
