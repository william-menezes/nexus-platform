import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ExtendTrialDto } from './dto/extend-trial.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  // ----------------------------------------------------------------
  // Metrics
  // ----------------------------------------------------------------

  @Get('metrics')
  getMetrics() {
    return this.svc.getMetrics();
  }

  // ----------------------------------------------------------------
  // Tenants
  // ----------------------------------------------------------------

  @Get('tenants')
  findAllTenants(
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: 'active' | 'inactive',
  ) {
    return this.svc.findAllTenants(search, plan, status);
  }

  @Get('tenants/:id')
  findOneTenant(@Param('id') id: string) {
    return this.svc.findOneTenant(id);
  }

  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.svc.updateTenant(id, dto);
  }

  @Post('tenants/:id/extend-trial')
  extendTrial(@Param('id') id: string, @Body() dto: ExtendTrialDto) {
    return this.svc.extendTrial(id, dto);
  }

  @Post('tenants/:id/revoke-subscription')
  revokeSubscription(@Param('id') id: string) {
    return this.svc.revokeSubscription(id);
  }

  // ----------------------------------------------------------------
  // Plans
  // ----------------------------------------------------------------

  @Get('plans')
  findAllPlans() {
    return this.svc.findAllPlans();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.svc.createPlan(dto);
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.svc.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.svc.deletePlan(id);
  }

  // ----------------------------------------------------------------
  // Coupons
  // ----------------------------------------------------------------

  @Get('coupons')
  findAllCoupons() {
    return this.svc.findAllCoupons();
  }

  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.svc.createCoupon(dto);
  }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.svc.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.svc.deleteCoupon(id);
  }
}
