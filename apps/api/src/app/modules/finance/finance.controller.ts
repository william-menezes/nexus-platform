import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { WhatsappService } from './whatsapp.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { CurrentTenant } from '../../core/decorators/tenant.decorator';
import { RequirePermission } from '../../core/decorators/permission.decorator';

@UseGuards(AuthGuard, PermissionGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly svc: FinanceService,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Get('sales')
  @RequirePermission('sales:read')
  findAll(@CurrentTenant() tenantId: string) {
    return this.svc.findAll(tenantId);
  }

  @Get('sales/:id')
  @RequirePermission('sales:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.findOne(tenantId, id);
  }

  @Post('sales')
  @RequirePermission('sales:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateSaleDto) {
    return this.svc.create(tenantId, dto);
  }

  @Post('sales/:id/cancel')
  @RequirePermission('sales:cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.cancel(tenantId, id);
  }

  // DRE — ex: GET /finance/dre?from=2026-01-01&to=2026-03-31
  @Get('dre')
  @RequirePermission('reports:read')
  getDre(
    @CurrentTenant() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.svc.getDre(tenantId, from, to);
  }

  // WhatsApp manual — POST /finance/whatsapp/send
  @Post('whatsapp/send')
  @HttpCode(HttpStatus.OK)
  sendWhatsapp(
    @Body() body: { phone: string; message: string },
  ) {
    return this.whatsapp.sendMessage(body.phone, body.message);
  }
}
