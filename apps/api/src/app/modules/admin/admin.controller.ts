import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.svc.getMetrics();
  }

  @Get('tenants')
  findAll(@Query('search') search?: string) {
    return this.svc.findAllTenants(search);
  }

  @Get('tenants/:id')
  findOne(@Param('id') id: string) {
    return this.svc.findOneTenant(id);
  }

  @Patch('tenants/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.svc.updateTenant(id, dto);
  }
}
