import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('equipment-types')
export class EquipmentTypesController {
  constructor(private readonly service: EquipmentsService) {}

  @Get()
  @RequirePermission('equipments:read')
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAllTypes(tenantId);
  }

  @Get(':id')
  @RequirePermission('equipments:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOneType(tenantId, id);
  }

  @Post()
  @RequirePermission('equipments:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateEquipmentTypeDto) {
    return this.service.createType(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('equipments:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateEquipmentTypeDto>) {
    return this.service.updateType(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('equipments:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.removeType(tenantId, id);
  }
}

@UseGuards(AuthGuard, PermissionGuard)
@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly service: EquipmentsService) {}

  @Get()
  @RequirePermission('equipments:read')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('typeId') typeId?: string,
  ) {
    return this.service.findAll(tenantId, clientId, typeId);
  }

  @Get(':id')
  @RequirePermission('equipments:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('equipments:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateEquipmentDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('equipments:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateEquipmentDto>) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('equipments:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
