import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get()
  @RequirePermission('purchase_orders:read')
  findAll(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.service.findAll(tenantId, search);
  }

  @Get(':id')
  @RequirePermission('purchase_orders:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('purchase_orders:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateSupplierDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('purchase_orders:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('purchase_orders:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
