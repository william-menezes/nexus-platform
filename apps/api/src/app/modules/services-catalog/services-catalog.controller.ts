import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ServicesCatalogService } from './services-catalog.service';
import { CreateServiceCatalogDto } from './dto/create-service-catalog.dto';
import { UpdateServiceCatalogDto } from './dto/update-service-catalog.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('services')
export class ServicesCatalogController {
  constructor(private readonly service: ServicesCatalogService) {}

  @Get()
  @RequirePermission('services_catalog:read')
  findAll(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.service.findAll(tenantId, search);
  }

  @Get(':id')
  @RequirePermission('services_catalog:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('services_catalog:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceCatalogDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('services_catalog:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateServiceCatalogDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('services_catalog:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
