import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @RequirePermission('employees:read')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findAll(tenantId, search, activeOnly === 'true');
  }

  @Get(':id')
  @RequirePermission('employees:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('employees:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('employees:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('employees:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }

  @Post('invite')
  @RequirePermission('employees:create')
  invite(@CurrentTenant() tenantId: string, @Body() dto: InviteEmployeeDto) {
    return this.service.invite(tenantId, dto);
  }
}
