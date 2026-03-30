import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../core/guards/permission.guard';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}

  @Get()
  @RequirePermission('clients:read')
  findAll(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.svc.findAll(tenantId, search);
  }

  @Get(':id')
  @RequirePermission('clients:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('clients:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto) {
    return this.svc.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('clients:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.svc.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('clients:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.remove(tenantId, id);
  }
}
