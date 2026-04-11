import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly svc: ContractsService) {}

  @Get()
  @RequirePermission('contracts:read')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.svc.findAll(tenantId, { status, clientId });
  }

  @Get(':id')
  @RequirePermission('contracts:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('contracts:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateContractDto) {
    return this.svc.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('contracts:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.svc.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('contracts:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.remove(tenantId, id);
  }

  @Post(':id/activate')
  @RequirePermission('contracts:update')
  activate(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.activate(tenantId, id);
  }

  @Post(':id/suspend')
  @RequirePermission('contracts:update')
  suspend(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.suspend(tenantId, id);
  }

  @Post(':id/cancel')
  @RequirePermission('contracts:update')
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.cancel(tenantId, id);
  }

  @Post(':id/bill')
  @RequirePermission('contracts:update')
  generateBilling(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.generateBilling(tenantId, id);
  }

  @Get(':id/billing')
  @RequirePermission('contracts:read')
  findBillingHistory(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findBillingHistory(tenantId, id);
  }
}
