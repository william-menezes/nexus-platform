import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { RequirePermission } from '../../core/decorators/permission.decorator';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class RejectDto {
  @IsString() @IsNotEmpty() reason: string;
}

@UseGuards(AuthGuard, PermissionGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly svc: ReturnsService) {}

  @Get()
  @RequirePermission('returns:read')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('saleId') saleId?: string,
  ) {
    return this.svc.findAll(tenantId, { status, saleId });
  }

  @Get(':id')
  @RequirePermission('returns:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('returns:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateReturnDto) {
    return this.svc.create(tenantId, dto);
  }

  @Patch(':id/approve')
  @RequirePermission('returns:create')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.approve(tenantId, id);
  }

  @Patch(':id/reject')
  @RequirePermission('returns:create')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectDto,
  ) {
    return this.svc.reject(tenantId, id, dto.reason);
  }

  @Post(':id/items/:itemId/stock')
  @RequirePermission('returns:create')
  returnToStock(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.svc.returnToStock(tenantId, id, itemId);
  }
}
