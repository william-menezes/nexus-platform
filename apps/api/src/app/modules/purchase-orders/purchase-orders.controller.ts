import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly svc: PurchaseOrdersService) {}

  @Get()
  @RequirePermission('purchase_orders:read')
  findAll(@CurrentTenant() tenantId: string, @Query('status') status?: string) {
    return this.svc.findAll(tenantId, status);
  }

  @Get(':id')
  @RequirePermission('purchase_orders:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('purchase_orders:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreatePurchaseOrderDto) {
    return this.svc.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('purchase_orders:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.svc.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('purchase_orders:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.remove(tenantId, id);
  }

  @Post(':id/receive')
  @RequirePermission('purchase_orders:update')
  receive(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.svc.receive(tenantId, id, dto);
  }
}
